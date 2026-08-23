#include "wallpaperscheme.h"

#include <QFile>
#include <QFileInfo>
#include <QMimeDatabase>
#include <QMutexLocker>
#include <QUrl>
#include <QWebEngineUrlRequestJob>

WallpaperSchemeHandler::WallpaperSchemeHandler(QObject *parent)
    : QWebEngineUrlSchemeHandler(parent) {}

void WallpaperSchemeHandler::setAllowedRoot(const QString &path) {
    QMutexLocker locker(&mutex_);
    QFileInfo info(path);
    allowedRoot_ = info.canonicalFilePath();
    if (allowedRoot_.isEmpty()) {
        allowedRoot_ = info.absoluteFilePath();
    }
}

QString WallpaperSchemeHandler::allowedRoot() const {
    QMutexLocker locker(&mutex_);
    return allowedRoot_;
}

void WallpaperSchemeHandler::requestStarted(QWebEngineUrlRequestJob *job) {
    const QString root = allowedRoot();
    if (root.isEmpty()) {
        job->fail(QWebEngineUrlRequestJob::RequestDenied);
        return;
    }

    const QString requested = QUrl::fromPercentEncoding(job->requestUrl().path().toUtf8());
    QFileInfo info(requested);
    QString canonical = info.canonicalFilePath();
    if (canonical.isEmpty()) canonical = info.absoluteFilePath();

    const QString rootPrefix = root.endsWith('/') ? root : root + '/';
    if (canonical != root && !canonical.startsWith(rootPrefix)) {
        job->fail(QWebEngineUrlRequestJob::RequestDenied);
        return;
    }
    if (!info.exists() || !info.isFile()) {
        job->fail(QWebEngineUrlRequestJob::UrlNotFound);
        return;
    }

    auto *file = new QFile(canonical, job);
    if (!file->open(QIODevice::ReadOnly)) {
        job->fail(QWebEngineUrlRequestJob::RequestFailed);
        return;
    }

    QMimeDatabase database;
    const QByteArray mime = database.mimeTypeForFile(info).name().toUtf8();
    job->reply(mime, file);
}
