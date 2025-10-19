# 🐧 Linux Wallpaper Engine GUI

A graphical user interface for managing wallpapers on Linux, powered by Neutralinojs, Svelte, and `linux-wallpaperengine`.

## 📸 Screenshots

#### Main Window

![Main Window](imgs/main.png)

#### Settings Window

![Settings Window](imgs/setting.png)

## ✨ Features

-    🖼️ **Wallpaper Management:** Browse and select wallpapers from your Steam Workshop content.
-    🖥️ **Multi-Monitor Support:** Select which screen to apply a wallpaper to from a dropdown in the top bar.
-    💾 **Auto-Save & Auto-Run:** Automatically saves the last used wallpaper and applies it on application startup.
-    ⚙️ **Customizable Settings:** Adjust the wallpaper's FPS and mute its audio. For advanced configuration, you can open the JSON config file directly from the settings.
-    🔍 **Wallpaper Details:** View detailed information about each wallpaper, including title, description, and workshop URL.
-    🔽 **System Tray Integration:** Minimize the application to the system tray for background operation.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

-    🐧 **[linux-wallpaperengine](https://github.com/Almamu/linux-wallpaperengine):** The command-line tool that this GUI interacts with. You can usually find this in your distribution's repositories or compile it from source.

## 🚀 Installation

### Install on Arch Linux

If you are using Arch Linux, you can build and install the application using the provided `PKGBUILD`. This will build and install a package named `linux-wallpaperengine-gui-git`.

```bash
mkdir -p /tmp/linux-wallpaperengine-gui-build && \
cd /tmp/linux-wallpaperengine-gui-build && \
curl -O https://raw.githubusercontent.com/AzPepoze/linux-wallpaperengine-gui/main/installer/PKGBUILD && \
makepkg -si && \
cd ~ && \
rm -rf /tmp/linux-wallpaperengine-gui-build
```

### Install on Other Linux Distributions

You can download pre-built binaries for various Linux distributions directly from the GitHub Releases page.

1. **Download the latest release for your system.**
     - Go to the [Latest Release Page](https://github.com/AzPepoze/linux-wallpaperengine-gui/releases/latest)
2. **Extract the archive and run the application.**

## ▶️ Usage

How you run the application depends on how it was installed.

### If Installed System-Wide (e.g., via AUR)

You can launch the application from your terminal or application menu.

-    **Normal Mode:**
     ```bash
     linux-wallpaperengine-gui
     ```
-    **Minimized Mode:** Start the application directly in the system tray.
     ```bash
     linux-wallpaperengine-gui --minimized
     ```

### If Using a Pre-built Binary

If you downloaded a pre-built binary, navigate to the extracted folder and execute the application file.

-    **Normal Mode:**
     ```bash
     ./linux-wallpaperengine-gui-linux_x64
     ```
-    **Minimized Mode:**
     ```bash
     ./linux-wallpaperengine-gui-linux_x64 --minimized
     ```

## 📖 How to Use the GUI

-    🖥️ **Choosing a Screen:** If you have multiple monitors, select the desired screen from the dropdown menu in the top bar.

-    🖱️ **Selecting a Wallpaper:** Click on any wallpaper in the grid to apply it to the currently selected screen.

-    ⚙️ **Settings:** Click the "Settings" icon to open the settings panel. Here you can:

     -    ⚡ Adjust the **FPS** (frames per second).

     -    🔇 Toggle **Mute Wallpaper Audio**.

     -    📄 Open the raw `config.json` file for advanced configuration.

     -    🗑️ **Clear All Wallpapers** to reset your setup.

-    ➡️ **Sidebar:** When a wallpaper is selected, a sidebar will appear on the right, showing detailed information about it.

-    🔽 **System Tray:** The application minimizes to the system tray when closed. You can right-click the tray icon to quit.

## 💻 Development

For those who want to contribute or build the application from source.

### Build from Source 🛠️

-    **Prerequisites:**

     -    Ensure you have Node.js and pnpm installed.

     -    Install the Neutralinojs CLI (`neu`) globally:

          ```bash

          npm install -g @neutralinojs/neu

          ```

1. **Clone the repository:**

     ```bash
     git clone https://github.com/AzPepoze/linux-wallpaperengine-gui.git
     cd linux-wallpaperengine-gui
     ```

2. **Install dependencies:**

     ```bash
     cd app
     pnpm install
     cd ..
     ```

3. **Build the application:**

     ```bash
     neu build
     ```

     This will create a distributable in the `dist` directory.

### Development Mode

To run the application with hot-reloading for development:

```bash
nue run
```

## 🤝 Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.
