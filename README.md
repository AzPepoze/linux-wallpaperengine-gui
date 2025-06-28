# Linux Wallpaper Engine GUI

A graphical user interface for managing wallpapers on Linux, powered by Electron, Svelte, and `linux-wallpaperengine`.

## Features

*   **Wallpaper Management:** Browse and select wallpapers from your Steam Workshop content.
*   **Auto-Save & Auto-Run:** Automatically saves the last used wallpaper and applies it on application startup.
*   **Silence Mode:** A setting to stop the wallpaper process, effectively silencing the wallpaper.
*   **Customizable Settings:** Configure screen and FPS settings for the wallpaper.
*   **Wallpaper Details:** View detailed information about each wallpaper, including title, description, tags, and workshop URL.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js and npm/pnpm:** For running the Electron application.
*   **`linux-wallpaperengine`:** The command-line tool that this GUI interacts with. You can usually find this in your distribution's repositories or compile it from source.
    *   [Link to `linux-wallpaperengine` GitHub (if available, otherwise remove this line or replace with instructions)]

## Installation

You have two options to get the Linux Wallpaper Engine GUI:

### Option 1: Download from Releases (Recommended)

Pre-built binaries for Linux are available in the [Releases](https://github.com/your-repo/linux-wallpaperengine-gui/releases) section of this repository.

1.  Go to the [Releases page](https://github.com/your-repo/linux-wallpaperengine-gui/releases).
2.  Download the latest `.AppImage` file (or other Linux package if provided).
3.  Make the AppImage executable:
    ```bash
    chmod +x linux-wallpaper-engine-gui-*.AppImage
    ```
4.  Run the application:
    ```bash
    ./linux-wallpaper-engine-gui-*.AppImage
    ```

### Option 2: Build from Source

If you prefer to build the application yourself, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/linux-wallpaperengine-gui.git
    cd linux-wallpaperengine-gui
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    # or npm install
    ```

## Usage

### Development Mode

To run the application in development mode:

```bash
pnpm dev
# or npm run dev
```
This will open the GUI.

### Production Build

To build the application for production:

```bash
pnpm build
# or npm run build
```
This will create an executable in the `dist` directory.

### How to Use the GUI

*   **Selecting a Wallpaper:** Click on any wallpaper in the grid to set it as your current wallpaper. The application will automatically save your selection.
*   **Settings:** Click on the "Settings" button (or equivalent, depending on UI) to open the settings panel. Here you can:
    *   Adjust the `SCREEN` (e.g., `DP-1`, `HDMI-A-1`) where the wallpaper will be displayed.
    *   Set the `FPS` (frames per second) for the wallpaper.
    *   Toggle **"Silence Wallpaper"** to stop the `linux-wallpaperengine` process and have no active wallpaper.
*   **Sidebar:** When a wallpaper is selected, a sidebar will appear on the right, showing detailed information about the wallpaper.

## Project Structure

*   `src/main/index.ts`: Main Electron process, handles IPC communication, wallpaper setting logic, and configuration management.
*   `src/preload/index.ts`: Preload script for exposing Electron APIs to the renderer process.
*   `src/renderer/src/App.svelte`: The main Svelte component for the user interface, displaying wallpapers and handling user interactions.
*   `src/renderer/src/components/Settings.svelte`: Svelte component for managing application settings.
*   `config.json`: Configuration file for storing user settings like `SCREEN`, `FPS`, `lastUsedWallpaper`, and `SILENCE` mode.

## Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.

## License

[Specify your license here, e.g., MIT License]
