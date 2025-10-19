import { app, debug, events, window } from "@neutralinojs/lib";

events
	.on("windowMaximize", () => {
		window.maximize();
	})
	.catch(console.error);

events
	.on("windowMinimize", () => {
		window.minimize();
	})
	.catch(console.error);

events
	.on("windowClose", () => {
		app.exit(0).catch(console.error);
	})
	.catch(console.error)
	.then(() => {
		debug.log("Attached window closer").catch(console.error);
	});
