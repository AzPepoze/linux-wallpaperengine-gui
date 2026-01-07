<h1 align="center">Linux Wallpaper Engine GUI</h1>

<div align="center">
<img src="showcase/preview-logo.png" alt="Linux Wallpaper Engine GUI Logo" width="128" height="128" style="border-radius: 20px;"/>
</div>

A graphical user interface for managing wallpapers on Linux, powered by Electron, Svelte, and `linux-wallpaperengine`.

## Screenshots

| Screen  |                  Image                   |
| :-----: | :--------------------------------------: |
|  Main   |    ![Main Window](showcase/main.png)     |
| Setting | ![Settings Window](showcase/setting.png) |

## Features

| Feature                     | Description                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Wallpaper Management**    | Browse and select wallpapers from your Steam Workshop content.                                                                           |
| **Multi-Monitor Support**   | Select which screen to apply a wallpaper to from a dropdown in the top bar.                                                              |
| **Auto-Save & Auto-Run**    | Automatically saves the last used wallpaper and applies it on application startup.                                                       |
| **Customizable Settings**   | Adjust the wallpaper's FPS and mute its audio. For advanced configuration, you can open the JSON config file directly from the settings. |
| **Wallpaper Details**       | View detailed information about each wallpaper, including title, description, and workshop URL.                                          |
| **System Tray Integration** | Minimize the application to the system tray for background operation.                                                                    |

## Prerequisites

-    [linux-wallpaperengine](https://github.com/Almamu/linux-wallpaperengine)

## Installation

### Install on Arch Linux

You can install from the [AUR](https://aur.archlinux.org/packages/linux-wallpaperengine-gui-git):

```bash
yay -S linux-wallpaperengine-gui
```

Or with another AUR helper like `paru`:
```bash
paru -S linux-wallpaperengine-gui
```

### Install on Other Linux Distributions

-    You can download pre-built binaries for various Linux distributions directly from the GitHub [Releases page](https://github.com/AzPepoze/linux-wallpaperengine-gui/releases/latest).

## Usage

How you run the application depends on how it was installed. The application supports the following command-line arguments:

| Argument      | Description                                          |
| :------------ | :--------------------------------------------------- |
| `(none)`      | Launches the application in normal mode.             |
| `--minimized` | Starts the application minimized in the system tray. |

### Build from Source

-    **Prerequisites:**
     -    Ensure you have Node.js and (npm or pnpm) installed.

1. **Clone the repository:**

     ```bash
     git clone https://github.com/AzPepoze/linux-wallpaperengine-gui
     cd linux-wallpaperengine-gui
     ```

2. **Install dependencies:**

     ```bash
     npm install
     ```

3. **Build the application:**

     ```bash
     npm run build
     ```

     This will create a distributable in the `dist` (or `release`) directory.

### Development Mode

-    To run the application with hot-reloading for development:

     ```bash
     npm run dev
     ```

## Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.
