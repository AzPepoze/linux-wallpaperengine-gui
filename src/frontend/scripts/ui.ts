import { writable } from "svelte/store";

export const showDisplayManager = writable(false);
export const activeView = writable<"wallpapers" | "logs" | "settings">("wallpapers");
