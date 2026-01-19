#!/bin/bash
# Get the directory where this script is located
# For AppImage, $APPDIR is set by the AppImageLauncher
if [ -n "$APPDIR" ]; then
    APP_DIR="$APPDIR"
else
    APP_DIR="$(dirname "$(readlink -f "$0")")"
fi

# Start the Go Backend (Manager)
if [ -f "$APP_DIR/resources/linux-wallpaperengine-gui" ]; then
    exec "$APP_DIR/resources/linux-wallpaperengine-gui" "$@"
elif [ -f "$APP_DIR/linux-wallpaperengine-gui-backend" ]; then
    # Fallback for some packaging styles
    exec "$APP_DIR/linux-wallpaperengine-gui-backend" "$@"
else
    # Fallback for development
    exec "$APP_DIR/build/backend/linux-wallpaperengine-gui" "$@"
fi
