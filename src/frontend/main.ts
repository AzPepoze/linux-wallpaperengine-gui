import "./app.scss";
import { mount } from "svelte";
import App from "./App.svelte";

console.log("Running Main");

// Mount the Svelte app
const app = mount(App, {
     target: document.getElementById("app")!,
});

export default app;
