import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

export interface ToastMessage {
	message: string;
	type: "success" | "error" | "warn" | "info";
}

export const toastStore: Writable<ToastMessage | null> = writable(null);

export function showToast(
	message: string,
	type: "success" | "error" | "warn" | "info" = "success",
	duration = 3000,
) {
	toastStore.set({ message, type });
	setTimeout(() => {
		toastStore.set(null);
	}, duration);
}

export function clearToast() {
	toastStore.set(null);
}
