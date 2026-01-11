<h1 align="center">
  <img src="showcase/preview-logo.png" alt="Logo" width="128" height="128" style="border-radius: 20px;"/><br>
  ✦ LINUX WALLPAPER ENGINE GUI ✦
</h1>

<p align="center">
  <strong>◈ A graphical user interface for managing wallpapers on Linux, powered by Electron and linux-wallpaperengine ◈</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/AzPepoze/linux-wallpaperengine-gui?style=for-the-badge&label=◈%20RELEASE%20◈&labelColor=%23181818&color=%23007bff" alt="Latest Release">
  <img src="https://img.shields.io/github/license/AzPepoze/linux-wallpaperengine-gui?style=for-the-badge&label=◈%20LICENSE%20◈&labelColor=%23181818&color=%23007bff" alt="License">
  <img src="https://img.shields.io/github/stars/AzPepoze/linux-wallpaperengine-gui?style=for-the-badge&label=◈%20STARS%20◈&labelColor=%23181818&color=%23007bff" alt="Stars">
  <img src="https://img.shields.io/aur/popularity/linux-wallpaperengine-gui-git?style=for-the-badge&label=◈%20AUR%20POPULARITY%20◈&labelColor=%23181818&color=%23007bff" alt="AUR Popularity">
  <img src="https://img.shields.io/aur/votes/linux-wallpaperengine-gui-git?style=for-the-badge&label=◈%20AUR%20VOTES%20◈&labelColor=%23181818&color=%23007bff" alt="AUR Votes">

</p>

## ◈ CONTENTS

-    [Screenshots](#◈-screenshots)
-    [Features](#◈-features)
-    [Prerequisites](#◈-prerequisites)
-    [Installation](#◈-installation)
-    [Usage](#◈-usage)
-    [Build from Source](#◈-build-from-source)
-    [Development](#◈-development)
-    [Contributing](#◈-contributing)

## ◈ FEATURES

-    **Wallpaper Management** – Browse and select wallpapers from your Steam Workshop content with ease.
-    **Multi-Monitor Support** – Effortlessly choose which screen to apply wallpapers to via the top bar.
-    **Auto-Save & Auto-Run** – Remembers your last used wallpaper and applies it automatically on startup.
-    **Customizable Settings** – Fine-tune performance with FPS control, mute audio, or edit raw JSON config.
-    **Detailed View** – Get full information about each wallpaper, including titles, descriptions, and Workshop links.
-    **System Tray** – Minimize to the tray for seamless background operation without cluttering your workspace.

## ◈ SCREENSHOTS

|            Main Window            |           Main Window (List)           |
| :-------------------------------: | :------------------------------------: |
| ![Main Window](showcase/main.png) | ![Main Window](showcase/main-list.png) |
|         Display Settings          |                Settings                |
| ![Details](showcase/display.png)  | ![Select Screen](showcase/setting.png) |

## ◈ PREREQUISITES

> [!IMPORTANT]
> This application requires [linux-wallpaperengine](https://github.com/Almamu/linux-wallpaperengine) to be installed on your system to function.

## ◈ INSTALLATION

### Arch Linux (AUR)

Install using your favorite AUR helper:

```bash
# Using yay
yay -S linux-wallpaperengine-gui-git

# Using paru
paru -S linux-wallpaperengine-gui-git
```

### Other Distributions

Download the latest pre-built binaries (AppImage, deb, rpm) from the [**Releases**](https://github.com/AzPepoze/linux-wallpaperengine-gui/releases/latest) page.

## ◈ USAGE

Launch it from your application menu or via terminal:

```bash
linux-wallpaperengine-gui [options]
```

### [Options]

-    `--minimized`: Starts the application minimized in the system tray.

## ◈ BUILD FROM SOURCE

**Requirements:** [Node.js](https://nodejs.org/) & [pnpm](https://pnpm.io/) (preferred) or npm.

1. **Clone & Enter:**
     ```bash
     git clone https://github.com/AzPepoze/linux-wallpaperengine-gui
     cd linux-wallpaperengine-gui
     ```
2. **Install Deps:**
     ```bash
     pnpm install
     ```
3. **Build:**

     ```bash
     pnpm run build
     ```

     The output will be in the `dist` directory.

## ◈ DEVELOPMENT

Run with hot-reloading:

```bash
pnpm run dev
```

## ◈ CONTRIBUTING

Feel free to contribute to this project by opening issues or submitting pull requests.

## ◈ STONKS!

<div align="center">
  <a href="https://www.star-history.com/#AzPepoze/linux-wallpaperengine-gui&type=date&legend=top-left">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=AzPepoze/linux-wallpaperengine-gui&type=date&theme=dark&legend=top-left" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=AzPepoze/linux-wallpaperengine-gui&type=date&legend=top-left" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=AzPepoze/linux-wallpaperengine-gui&type=date&legend=top-left" width="600" />
    </picture>
  </a>
  <br>
  <br>
  <strong>✦ Made with ♥︎ by AzPepoze ✦</strong>
</div>
