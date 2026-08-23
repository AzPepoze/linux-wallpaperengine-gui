cmake_minimum_required(VERSION 3.21)
project(linux-wallpaperengine-webview LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS
    Core
    Gui
    Widgets
    Network
    WebChannel
    WebEngineCore
    WebEngineWidgets
)

set(APP_VERSION "dev" CACHE STRING "Application version exposed to the renderer")

add_executable(linux-wallpaperengine-webview
    main.cpp
    runtimebridge.cpp
    runtimebridge.h
    wallpaperscheme.cpp
    wallpaperscheme.h
)

target_compile_definitions(linux-wallpaperengine-webview PRIVATE
    LWE_GUI_VERSION="${APP_VERSION}"
)

target_link_libraries(linux-wallpaperengine-webview PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Network
    Qt6::WebChannel
    Qt6::WebEngineCore
    Qt6::WebEngineWidgets
)

install(TARGETS linux-wallpaperengine-webview
    RUNTIME DESTINATION lib/linux-wallpaperengine-gui
)
