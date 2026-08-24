#pragma once

#include <QMutex>
#include <QString>
#include <QWebEngineUrlSchemeHandler>

class WallpaperSchemeHandler final : public QWebEngineUrlSchemeHandler {
    Q_OBJECT

public:
    explicit WallpaperSchemeHandler(QObject *parent = nullptr);

    void setAllowedRoot(const QString &path);
    void requestStarted(QWebEngineUrlRequestJob *job) override;

private:
    QString allowedRoot() const;

    mutable QMutex mutex_;
    QString allowedRoot_;
};
