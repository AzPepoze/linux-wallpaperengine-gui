import "./app.scss";
import { mount } from "svelte";
import App from "./App.svelte";
import { initializeRuntimeBridge } from "./runtime/bridge";

await initializeRuntimeBridge();

const app = mount(App, {
	target: document.getElementById("app")!,
});

export default app;
