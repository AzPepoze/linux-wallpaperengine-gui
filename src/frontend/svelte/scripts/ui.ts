import { writable } from "svelte/store";

export const showDisplayManager = writable(false);
export const showPlaylistManager = writable(false);
export const activeView = writable<
	"wallpapers" | "logs" | "settings" | "workshop"
>("wallpapers");

const savedWidth = localStorage.getItem("sidebarWidth");
export const sidebarWidth = writable(savedWidth ? parseInt(savedWidth) : 350);

sidebarWidth.subscribe((value) => {
	localStorage.setItem("sidebarWidth", value.toString());
});
