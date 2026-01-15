#!/bin/bash
# Get the directory where this script is located
APP_DIR="$(dirname "$(readlink -f "$0")")"

# Start the Go Backend (Manager)
# In production, it's located in resources/linux-wallpaperengine-gui
if [ -f "$APP_DIR/resources/linux-wallpaperengine-gui" ]; then
    exec "$APP_DIR/resources/linux-wallpaperengine-gui"
else
    # Fallback for development if someone runs this script
    exec "$APP_DIR/build/backend/linux-wallpaperengine-gui"
fi
