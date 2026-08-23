#include "runtimebridge.h"
#include "wallpaperscheme.h"

#include <QApplication>
#include <QCommandLineOption>
#include <QCommandLineParser>
#include <QFileInfo>
#include <QUrl>
#include <QWebChannel>
#include <QWebEngineProfile>
#include <QWebEngineSettings>
#include <QWebEngineUrlScheme>
#include <QWebEngineView>

#ifndef LWE_GUI_VERSION
#define LWE_GUI_VERSION "dev"
#endif

namespace {
void registerWallpaperScheme() {
    QWebEngineUrlScheme scheme(QByteArrayLiteral("wallpaper"));
    scheme.setSyntax(QWebEngineUrlScheme::Syntax::Path);
    scheme.setDefaultPort(-1);
    scheme.setFlags(QWebEngineUrlScheme::SecureScheme |
                    QWebEngineUrlScheme::LocalScheme |
                    QWebEngineUrlScheme::LocalAccessAllowed |
                    QWebEngineUrlScheme::CorsEnabled);
    QWebEngineUrlScheme::registerScheme(scheme);
}

bool hasRawArgument(int argc, char **argv, const char *name) {
    for (int i = 1; i < argc; ++i) {
        if (QByteArray(argv[i]) == name) return true;
    }
    return false;
}
}

int main(int argc, char **argv) {
    registerWallpaperScheme();
    if (hasRawArgument(argc, argv, "--debug-mode")) {
        qputenv("QTWEBENGINE_REMOTE_DEBUGGING", QByteArrayLiteral("9222"));
    }

    QApplication app(argc, argv);
    app.setApplicationName(QStringLiteral("linux-wallpaperengine-gui"));
    app.setApplicationDisplayName(QStringLiteral("Linux Wallpaper Engine GUI"));
    app.setApplicationVersion(QStringLiteral(LWE_GUI_VERSION));
    app.setOrganizationName(QStringLiteral("AzPepoze"));

    QCommandLineParser parser;
    parser.setApplicationDescription(QStringLiteral("Qt WebEngine host for Linux Wallpaper Engine GUI"));
    parser.addHelpOption();
    parser.addVersionOption();
    parser.addOption(QCommandLineOption(QStringLiteral("url"), QStringLiteral("Load a development URL instead of built assets"), QStringLiteral("url")));
    parser.addOption(QCommandLineOption(QStringLiteral("frontend-dir"), QStringLiteral("Directory containing the built Vite frontend"), QStringLiteral("directory")));
    parser.addOption(QCommandLineOption(QStringLiteral("transparent"), QStringLiteral("Enable transparent window background")));
    parser.addOption(QCommandLineOption(QStringLiteral("debug-mode"), QStringLiteral("Enable WebEngine developer extras")));
    parser.process(app);

    auto *view = new QWebEngineView();
    view->setWindowTitle(QStringLiteral("Linux Wallpaper Engine GUI"));
    view->resize(1200, 800);

    if (parser.isSet(QStringLiteral("transparent"))) {
        view->setAttribute(Qt::WA_TranslucentBackground, true);
        view->setStyleSheet(QStringLiteral("background: transparent;"));
        view->page()->setBackgroundColor(Qt::transparent);
    }

    view->settings()->setAttribute(QWebEngineSettings::JavascriptEnabled, true);
    view->settings()->setAttribute(QWebEngineSettings::LocalContentCanAccessFileUrls, false);
    view->settings()->setAttribute(QWebEngineSettings::LocalContentCanAccessRemoteUrls, true);
    view->settings()->setAttribute(QWebEngineSettings::WebGLEnabled, true);
    view->settings()->setAttribute(QWebEngineSettings::Accelerated2dCanvasEnabled, true);
    view->settings()->setAttribute(QWebEngineSettings::FullScreenSupportEnabled, true);

    auto *schemeHandler = new WallpaperSchemeHandler(view);
    view->page()->profile()->installUrlSchemeHandler(QByteArrayLiteral("wallpaper"), schemeHandler);

    auto *channel = new QWebChannel(view);
    auto *bridge = new RuntimeBridge(view, schemeHandler, view);
    channel->registerObject(QStringLiteral("runtimeBridge"), bridge);
    view->page()->setWebChannel(channel);
    bridge->connectBackend();

    const QString devUrl = parser.value(QStringLiteral("url"));
    if (!devUrl.isEmpty()) {
        view->load(QUrl(devUrl));
    } else {
        QString frontendDir = parser.value(QStringLiteral("frontend-dir"));
        if (frontendDir.isEmpty()) {
            frontendDir = QCoreApplication::applicationDirPath() + QStringLiteral("/../share/linux-wallpaperengine-gui/frontend");
        }
        const QString indexPath = QFileInfo(frontendDir + QStringLiteral("/index.html")).absoluteFilePath();
        view->load(QUrl::fromLocalFile(indexPath));
    }

    view->show();
    return app.exec();
}
