# Linux Wallpaper Engine GUI

A graphical user interface for managing wallpapers on Linux, powered by Neutralinojs, Svelte, and `linux-wallpaperengine`.

## Screenshots

| Screen | Image |
| :-: | :-: |
| Main | ![Main Window](imgs/main.png) |
| Setting | ![Settings Window](imgs/setting.png) |

## Features

| Feature | Description |
| --- | --- |
| **Wallpaper Management** | Browse and select wallpapers from your Steam Workshop content. |
| **Multi-Monitor Support** | Select which screen to apply a wallpaper to from a dropdown in the top bar. |
| **Auto-Save & Auto-Run** | Automatically saves the last used wallpaper and applies it on application startup. |
| **Customizable Settings** | Adjust the wallpaper's FPS and mute its audio. For advanced configuration, you can open the JSON config file directly from the settings. |
| **Wallpaper Details** | View detailed information about each wallpaper, including title, description, and workshop URL. |
| **System Tray Integration** | Minimize the application to the system tray for background operation. |

## Prerequisites

> [!IMPORTANT]
> Before you begin, you must have `linux-wallpaperengine` installed. This is the command-line tool that the GUI interacts with. You can usually find this in your distribution's repositories or compile it from source.

## Installation

- ### Install on Arch Linux
     - If you are using Arch Linux, you can build and install the application using the provided `PKGBUILD`. This will build and install a package named `linux-wallpaperengine-gui-git`.

          ```bash
          mkdir -p /tmp/linux-wallpaperengine-gui-build && \
          cd /tmp/linux-wallpaperengine-gui-build && \
          curl -O https://raw.githubusercontent.com/AzPepoze/linux-wallpaperengine-gui/main/installer/PKGBUILD && \
          makepkg -si && \
          cd ~ && \
          rm -rf /tmp/linux-wallpaperengine-gui-build
          ```

### Install on Other Linux Distributions
- You can download pre-built binaries for various Linux distributions directly from the GitHub Releases page.
     
     1.  **Download the latest release for your system.**
         -   Go to the [Latest Release Page](https://github.com/AzPepoze/linux-wallpaperengine-gui/releases/latest)
     2.  **Extract the archive and run the application.**

## Usage

How you run the application depends on how it was installed. The application supports the following command-line arguments:

| Argument      | Description                                         |
| :------------ | :-------------------------------------------------- |
| `(none)`      | Launches the application in normal mode.            |
| `--minimized` | Starts the application minimized in the system tray. |

## UI

### Select a Screen

-   Select the desired screen from the dropdown menu located in the top-left.

### Select a Wallpaper

-   Click on any wallpaper in the main grid view. It will be applied to the screen that you selected.

### Settings

-   Click the "Settings" icon to open the settings panel. Here you can:
    -   Adjust the **FPS** (frames per second).
    -   Toggle **Mute Wallpaper Audio**.
    -   Open the raw `config.json` file for advanced configuration.
    -   **Clear All Wallpapers** to reset your setup.

### Sidebar
- When a wallpaper is selected, a sidebar will appear on the right, showing detailed information about it.
     
### System Tray
- The application minimizes to the system tray when closed. You can right-click the tray icon to quit.

## Development
- For those who want to contribute or build the application from source.

### Build from Source

-   **Prerequisites:**
    -   Ensure you have Node.js and pnpm installed.
    -   Install the Neutralinojs CLI (`neu`) globally:
        ```bash
        npm install -g @neutralinojs/neu
        ```

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AzPepoze/linux-wallpaperengine-gui.git
    cd linux-wallpaperengine-gui
    ```

2.  **Install dependencies:**
    ```bash
    cd app
    pnpm install
    cd ..
    ```

3.  **Build the application:**
    ```bash
    neu build
    ```
    This will create a distributable in the `dist` directory.

### Development Mode

- To run the application with hot-reloading for development, run following command.

     ```bash
     neu run
     ```

## Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.
