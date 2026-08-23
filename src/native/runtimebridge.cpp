#include "runtimebridge.h"

#include "wallpaperscheme.h"

#include <QApplication>
#include <QBuffer>
#include <QDesktopServices>
#include <QDir>
#include <QDirIterator>
#include <QFile>
#include <QFileDialog>
#include <QFileInfo>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonParseError>
#include <QMimeDatabase>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QProcessEnvironment>
#include <QStandardPaths>
#include <QTimer>
#include <QUrl>
#include <QWebEngineView>

namespace {
QString jsonString(const QJsonValue &value) {
    if (value.isUndefined()) {
        return QStringLiteral("null");
    }
    if (value.isObject()) {
        return QString::fromUtf8(QJsonDocument(value.toObject()).toJson(QJsonDocument::Compact));
    }
    if (value.isArray()) {
        return QString::fromUtf8(QJsonDocument(value.toArray()).toJson(QJsonDocument::Compact));
    }

    QJsonArray wrapper;
    wrapper.append(value);
    QByteArray encoded = QJsonDocument(wrapper).toJson(QJsonDocument::Compact);
    if (encoded.size() >= 2) {
        encoded = encoded.mid(1, encoded.size() - 2);
    }
    return QString::fromUtf8(encoded);
}

QJsonValue parseJsonValue(const QString &json) {
    const QByteArray bytes = json.toUtf8().trimmed();
    if (bytes.isEmpty() || bytes == "undefined") {
        return QJsonObject{};
    }

    QJsonParseError error{};
    QJsonDocument document = QJsonDocument::fromJson(bytes, &error);
    if (error.error == QJsonParseError::NoError) {
        if (document.isObject()) return document.object();
        if (document.isArray()) return document.array();
    }

    QJsonDocument wrapped = QJsonDocument::fromJson("[" + bytes + "]", &error);
    if (error.error == QJsonParseError::NoError && wrapped.isArray() && !wrapped.array().isEmpty()) {
        return wrapped.array().first();
    }
    return QJsonObject{};
}

QJsonValue arrayArgument(const QJsonValue &params, int index) {
    if (params.isArray()) {
        const QJsonArray array = params.toArray();
        return index >= 0 && index < array.size() ? array.at(index) : QJsonValue();
    }
    return index == 0 ? params : QJsonValue();
}
}

RuntimeBridge::RuntimeBridge(QWebEngineView *view, WallpaperSchemeHandler *schemeHandler, QObject *parent)
    : QObject(parent), view_(view), schemeHandler_(schemeHandler) {
    connect(&socket_, &QLocalSocket::readyRead, this, &RuntimeBridge::readBackendData);
    connect(&socket_, &QLocalSocket::disconnected, this, &RuntimeBridge::backendDisconnected);
}

void RuntimeBridge::connectBackend() {
    if (socket_.state() == QLocalSocket::ConnectedState || socket_.state() == QLocalSocket::ConnectingState) {
        return;
    }

    socket_.connectToServer(QDir::temp().filePath(QStringLiteral("linux-wallpaperengine-gui.sock")));
    if (socket_.waitForConnected(5000)) {
        emit backendReady();
        requestWallpaperRoot();
        return;
    }

    QTimer::singleShot(300, this, &RuntimeBridge::connectBackend);
}

void RuntimeBridge::backendDisconnected() {
    QTimer::singleShot(300, this, &RuntimeBridge::connectBackend);
}

QString RuntimeBridge::normalizePathArgument(const QJsonValue &params, int index) const {
    QString path = arrayArgument(params, index).toString();
    if (path.startsWith(QStringLiteral("~/"))) {
        path = QDir::home().filePath(path.mid(2));
    }
    return QDir::cleanPath(path);
}

qint64 RuntimeBridge::directorySize(const QString &path) const {
    qint64 total = 0;
    QDirIterator iterator(path, QDir::Files | QDir::NoSymLinks | QDir::Hidden | QDir::System,
                          QDirIterator::Subdirectories);
    while (iterator.hasNext()) {
        iterator.next();
        total += iterator.fileInfo().size();
    }
    return total;
}

void RuntimeBridge::invoke(const QString &method, const QString &paramsJson, int requestId) {
    const QJsonValue params = parseJsonValue(paramsJson);
    if (handleLocal(method, params, requestId)) {
        return;
    }
    proxyToBackend(method, params, requestId);
}

bool RuntimeBridge::handleLocal(const QString &method, const QJsonValue &params, int requestId) {
    if (method == QStringLiteral("send-log")) {
        const QJsonArray args = params.toArray();
        QStringList parts;
        for (const auto &arg : args) parts << arg.toVariant().toString();
        qInfo().noquote() << parts.join(' ');
        resolveJson(requestId, QJsonValue());
        return true;
    }

    if (method == QStringLiteral("window-minimize")) {
        if (view_) view_->window()->showMinimized();
        resolveJson(requestId, QJsonValue());
        return true;
    }
    if (method == QStringLiteral("window-maximize")) {
        if (view_) {
            QWidget *window = view_->window();
            window->isMaximized() ? window->showNormal() : window->showMaximized();
        }
        resolveJson(requestId, QJsonValue());
        return true;
    }
    if (method == QStringLiteral("window-hide")) {
        if (view_) view_->window()->close();
        resolveJson(requestId, QJsonValue());
        return true;
    }
    if (method == QStringLiteral("app-exit")) {
        proxyToBackend(QStringLiteral("quit"), QJsonObject{}, requestId);
        QTimer::singleShot(250, qApp, &QApplication::quit);
        return true;
    }
    if (method == QStringLiteral("restart-ui")) {
        proxyToBackend(QStringLiteral("restart-ui"), QJsonObject{}, requestId);
        QTimer::singleShot(200, qApp, &QApplication::quit);
        return true;
    }

    if (method == QStringLiteral("get-env")) {
        const QString key = arrayArgument(params, 0).toString();
        resolveJson(requestId, QProcessEnvironment::systemEnvironment().value(key));
        return true;
    }
    if (method == QStringLiteral("get-home-dir")) {
        resolveJson(requestId, QDir::homePath());
        return true;
    }
    if (method == QStringLiteral("get-version")) {
        resolveJson(requestId, QCoreApplication::applicationVersion());
        return true;
    }
    if (method == QStringLiteral("get-app-icon")) {
        QString iconPath = QCoreApplication::applicationDirPath() + QStringLiteral("/../share/linux-wallpaperengine-gui/frontend/icon.png");
        QFile file(QDir::cleanPath(iconPath));
        if (!file.open(QIODevice::ReadOnly)) {
            resolveJson(requestId, QString());
        } else {
            resolveJson(requestId, QString::fromLatin1(file.readAll().toBase64()));
        }
        return true;
    }
    if (method == QStringLiteral("open-external")) {
        const bool ok = QDesktopServices::openUrl(QUrl(arrayArgument(params, 0).toString()));
        ok ? resolveJson(requestId, QJsonValue()) : reject(requestId, QStringLiteral("Failed to open URL"));
        return true;
    }
    if (method == QStringLiteral("open-path")) {
        const bool ok = QDesktopServices::openUrl(QUrl::fromLocalFile(normalizePathArgument(params)));
        resolveJson(requestId, ok ? QString() : QStringLiteral("Failed to open path"));
        return true;
    }

    if (method == QStringLiteral("select-dir")) {
        resolveJson(requestId, QFileDialog::getExistingDirectory(view_, QStringLiteral("Select directory"), QDir::homePath()));
        return true;
    }
    if (method == QStringLiteral("select-file")) {
        resolveJson(requestId, QFileDialog::getOpenFileName(view_, QStringLiteral("Select file"), QDir::homePath()));
        return true;
    }
    if (method == QStringLiteral("fs-read-dir")) {
        QDir directory(normalizePathArgument(params));
        if (!directory.exists()) {
            reject(requestId, QStringLiteral("Directory does not exist"));
            return true;
        }
        QJsonArray result;
        const QFileInfoList entries = directory.entryInfoList(QDir::AllEntries | QDir::NoDotAndDotDot | QDir::Hidden, QDir::Name);
        for (const QFileInfo &entry : entries) {
            result.append(QJsonObject{{QStringLiteral("entry"), entry.fileName()},
                                      {QStringLiteral("type"), entry.isDir() ? QStringLiteral("DIRECTORY") : QStringLiteral("FILE")}});
        }
        resolveJson(requestId, result);
        return true;
    }
    if (method == QStringLiteral("fs-read-file")) {
        QFile file(normalizePathArgument(params));
        if (!file.open(QIODevice::ReadOnly)) {
            reject(requestId, file.errorString());
        } else {
            resolveJson(requestId, QString::fromUtf8(file.readAll()));
        }
        return true;
    }
    if (method == QStringLiteral("fs-write-file")) {
        QFile file(normalizePathArgument(params, 0));
        if (!file.open(QIODevice::WriteOnly | QIODevice::Truncate)) {
            reject(requestId, file.errorString());
        } else {
            file.write(arrayArgument(params, 1).toString().toUtf8());
            resolveJson(requestId, QJsonValue());
        }
        return true;
    }
    if (method == QStringLiteral("fs-read-binary")) {
        QFile file(normalizePathArgument(params));
        if (!file.open(QIODevice::ReadOnly)) {
            reject(requestId, file.errorString());
        } else {
            resolveJson(requestId, QString::fromLatin1(file.readAll().toBase64()));
        }
        return true;
    }
    if (method == QStringLiteral("fs-exists")) {
        resolveJson(requestId, QFileInfo::exists(normalizePathArgument(params)));
        return true;
    }
    if (method == QStringLiteral("get-directory-size")) {
        const QString path = normalizePathArgument(params);
        resolveJson(requestId, static_cast<double>(QFileInfo::exists(path) ? directorySize(path) : 0));
        return true;
    }

    if (method == QStringLiteral("fetch-image")) {
        const QUrl url(arrayArgument(params, 0).toString());
        if (!url.isValid() || (url.scheme() != QStringLiteral("http") && url.scheme() != QStringLiteral("https"))) {
            reject(requestId, QStringLiteral("Invalid image URL"));
            return true;
        }
        QNetworkReply *reply = network_.get(QNetworkRequest(url));
        connect(reply, &QNetworkReply::finished, this, [this, reply, requestId]() {
            reply->deleteLater();
            if (reply->error() != QNetworkReply::NoError) {
                reject(requestId, reply->errorString());
                return;
            }
            const QByteArray type = reply->header(QNetworkRequest::ContentTypeHeader).toByteArray().split(';').first();
            const QByteArray mime = type.isEmpty() ? QByteArrayLiteral("image/jpeg") : type;
            const QString data = QStringLiteral("data:%1;base64,%2")
                                     .arg(QString::fromLatin1(mime), QString::fromLatin1(reply->readAll().toBase64()));
            resolveJson(requestId, data);
        });
        return true;
    }

    if (method == QStringLiteral("get-wallpaper-preview")) {
        resolveJson(requestId, QJsonObject{{QStringLiteral("success"), true}, {QStringLiteral("data"), arrayArgument(params, 0)}});
        return true;
    }
    if (method == QStringLiteral("get-wallpaper-properties")) {
        resolveJson(requestId, QJsonArray{});
        return true;
    }
    if (method == QStringLiteral("validate-executable")) {
        resolveJson(requestId, true);
        return true;
    }

    return false;
}

void RuntimeBridge::proxyToBackend(const QString &method, const QJsonValue &params, int requestId) {
    if (socket_.state() != QLocalSocket::ConnectedState) {
        connectBackend();
        if (socket_.state() != QLocalSocket::ConnectedState) {
            reject(requestId, QStringLiteral("Go backend is not connected"));
            return;
        }
    }

    const int backendId = nextBackendId_++;
    pendingBackendRequests_.insert(backendId, requestId);
    QJsonObject request{{QStringLiteral("id"), backendId},
                        {QStringLiteral("method"), method},
                        {QStringLiteral("params"), params.isUndefined() ? QJsonValue(QJsonObject{}) : params}};
    socket_.write(QJsonDocument(request).toJson(QJsonDocument::Compact));
    socket_.write("\n");
    socket_.flush();
}

void RuntimeBridge::requestWallpaperRoot() {
    const int backendId = nextBackendId_++;
    wallpaperRootRequestId_ = backendId;
    QJsonObject request{{QStringLiteral("id"), backendId},
                        {QStringLiteral("method"), QStringLiteral("get-wallpaper-base-path")},
                        {QStringLiteral("params"), QJsonObject{}}};
    socket_.write(QJsonDocument(request).toJson(QJsonDocument::Compact));
    socket_.write("\n");
    socket_.flush();
}

void RuntimeBridge::setWallpaperRootFromResponse(const QJsonValue &value) {
    if (schemeHandler_ && value.isString()) {
        schemeHandler_->setAllowedRoot(value.toString());
    }
}

void RuntimeBridge::readBackendData() {
    backendBuffer_.append(socket_.readAll());
    while (true) {
        const qsizetype newline = backendBuffer_.indexOf('\n');
        if (newline < 0) break;
        const QByteArray line = backendBuffer_.left(newline).trimmed();
        backendBuffer_.remove(0, newline + 1);
        if (line.isEmpty()) continue;

        QJsonParseError error{};
        const QJsonDocument document = QJsonDocument::fromJson(line, &error);
        if (error.error != QJsonParseError::NoError || !document.isObject()) continue;
        const QJsonObject message = document.object();

        if (!message.contains(QStringLiteral("id"))) {
            emit eventReceived(message.value(QStringLiteral("method")).toString(),
                               jsonString(message.value(QStringLiteral("params"))));
            continue;
        }

        const int backendId = message.value(QStringLiteral("id")).toInt();
        if (backendId == wallpaperRootRequestId_) {
            wallpaperRootRequestId_ = -1;
            setWallpaperRootFromResponse(message.value(QStringLiteral("result")));
            continue;
        }

        if (!pendingBackendRequests_.contains(backendId)) continue;
        const int requestId = pendingBackendRequests_.take(backendId);
        const QString errorMessage = message.value(QStringLiteral("error")).toString();
        if (!errorMessage.isEmpty()) {
            reject(requestId, errorMessage);
        } else {
            resolveJson(requestId, message.value(QStringLiteral("result")));
        }
    }
}

void RuntimeBridge::resolveJson(int requestId, const QJsonValue &value) {
    emit resolved(requestId, jsonString(value));
}

void RuntimeBridge::reject(int requestId, const QString &message) {
    emit rejected(requestId, message);
}
