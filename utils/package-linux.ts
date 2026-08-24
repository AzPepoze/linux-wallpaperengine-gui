import {
	chmod,
	cp,
	mkdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import path from "node:path";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const root = path.resolve("dist/linux-unpacked");

await rm(root, { recursive: true, force: true });
await mkdir(path.join(root, "bin"), { recursive: true });
await mkdir(path.join(root, "lib/linux-wallpaperengine-gui"), { recursive: true });
await mkdir(path.join(root, "share/linux-wallpaperengine-gui"), { recursive: true });
await mkdir(path.join(root, "share/applications"), { recursive: true });
await mkdir(path.join(root, "share/metainfo"), { recursive: true });
await mkdir(path.join(root, "share/icons/hicolor/256x256/apps"), { recursive: true });

await cp("build/backend/linux-wallpaperengine-gui", path.join(root, "bin/linux-wallpaperengine-gui"));
await chmod(path.join(root, "bin/linux-wallpaperengine-gui"), 0o755);
await cp(
	"build/backend/linux-wallpaperengine-steam-helper",
	path.join(root, "lib/linux-wallpaperengine-gui/linux-wallpaperengine-steam-helper"),
);
await chmod(
	path.join(root, "lib/linux-wallpaperengine-gui/linux-wallpaperengine-steam-helper"),
	0o755,
);
await cp("build/native/linux-wallpaperengine-webview", path.join(root, "lib/linux-wallpaperengine-gui/linux-wallpaperengine-webview"));
await chmod(path.join(root, "lib/linux-wallpaperengine-gui/linux-wallpaperengine-webview"), 0o755);
await cp("build/frontend", path.join(root, "share/linux-wallpaperengine-gui/frontend"), { recursive: true });
await cp("packaging/io.github.AzPepoze.linux-wallpaperengine-gui.desktop", path.join(root, "share/applications/io.github.AzPepoze.linux-wallpaperengine-gui.desktop"));
await cp("packaging/io.github.AzPepoze.linux-wallpaperengine-gui.metainfo.xml", path.join(root, "share/metainfo/io.github.AzPepoze.linux-wallpaperengine-gui.metainfo.xml"));
await cp("src/public/icon.png", path.join(root, "share/icons/hicolor/256x256/apps/io.github.AzPepoze.linux-wallpaperengine-gui.png"));

await writeFile(
	path.join(root, "README.runtime.txt"),
	`Linux Wallpaper Engine GUI ${pkg.version}\n\n` +
		"This package intentionally does not bundle Chromium/Electron.\n" +
		"Runtime dependencies: Qt 6 Core/Gui/Widgets/Network/WebChannel/WebEngine.\n" +
		"Steam Workshop uses a native Steamworks bridge. If Steam is the Flatpak com.valvesoftware.Steam, the packaged helper is entered into the already-running Steam sandbox automatically.\n" +
		"Set LWE_STEAM_API_LIBRARY when libsteam_api.so is not otherwise discoverable.\n",
);

const archive = path.resolve(`dist/linux-wallpaperengine-gui-${pkg.version}-linux-x86_64.tar.gz`);
await rm(archive, { force: true });
const tar = Bun.spawn(["tar", "-C", root, "-czf", archive, "."], {
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
});
const code = await tar.exited;
if (code !== 0) process.exit(code);
console.log(`Created ${archive}`);
