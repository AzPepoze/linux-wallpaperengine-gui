#pragma once

#include <QHash>
#include <QJsonValue>
#include <QLocalSocket>
#include <QNetworkAccessManager>
#include <QObject>
#include <QPointer>
#include <QString>
#include <QVariant>

class QWebEngineView;
class WallpaperSchemeHandler;

class RuntimeBridge final : public QObject {
    Q_OBJECT

public:
    explicit RuntimeBridge(QWebEngineView *view, WallpaperSchemeHandler *schemeHandler, QObject *parent = nullptr);

    void connectBackend();

public slots:
    void invoke(const QString &method, const QString &paramsJson, int requestId);

signals:
    void resolved(int requestId, const QString &resultJson);
    void rejected(int requestId, const QString &message);
    void eventReceived(const QString &method, const QString &paramsJson);
    void backendReady();

private slots:
    void readBackendData();
    void backendDisconnected();

private:
    bool handleLocal(const QString &method, const QJsonValue &params, int requestId);
    void proxyToBackend(const QString &method, const QJsonValue &params, int requestId);
    void resolveJson(int requestId, const QJsonValue &value);
    void reject(int requestId, const QString &message);
    void requestWallpaperRoot();
    void setWallpaperRootFromResponse(const QJsonValue &value);

    QString normalizePathArgument(const QJsonValue &params, int index = 0) const;
    qint64 directorySize(const QString &path) const;

    QPointer<QWebEngineView> view_;
    WallpaperSchemeHandler *schemeHandler_;
    QLocalSocket socket_;
    QByteArray backendBuffer_;
    int nextBackendId_ = 100000;
    QHash<int, int> pendingBackendRequests_;
    int wallpaperRootRequestId_ = -1;
    QNetworkAccessManager network_;
};
