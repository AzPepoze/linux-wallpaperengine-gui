set_project("linux-wallpaperengine-webview")
set_languages("c++20")
add_rules("mode.debug", "mode.release")

local app_version = os.getenv("LWE_GUI_VERSION") or "dev"

target("linux-wallpaperengine-webview")
    set_kind("binary")
    add_rules("qt.widgetapp")

    add_files(
        "main.cpp",
        "runtimebridge.cpp",
        "wallpaperscheme.cpp",
        "runtimebridge.h"
    )

    add_headerfiles(
        "runtimebridge.h",
        "wallpaperscheme.h"
    )

    add_frameworks(
        "QtCore",
        "QtGui",
        "QtWidgets",
        "QtNetwork",
        "QtWebChannel",
        "QtWebEngineCore",
        "QtWebEngineWidgets"
    )

    add_defines('LWE_GUI_VERSION="' .. app_version .. '"')
    set_targetdir("../../build/native")

    before_build(function ()
        local qtver = get_config("qt_sdkver")
        if not qtver or not qtver:match("^6%.") then
            raise("Qt 6 is required for linux-wallpaperengine-webview (detected: %s)", qtver or "unknown")
        end
    end)
