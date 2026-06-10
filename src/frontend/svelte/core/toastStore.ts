import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

export interface ToastMessage {
	id: string;
	message: string;
	type: "success" | "error" | "warn" | "info";
	duration: number;
}

export const toastStore: Writable<ToastMessage[]> = writable([]);

export function showToast(
	message: string,
	type: "success" | "error" | "warn" | "info" = "success",
	duration = 3000,
) {
	const id = Math.random().toString(36).substring(2, 9);
	toastStore.update((toasts) => [{ id, message, type, duration }, ...toasts]);
}

export function removeToast(id: string) {
	toastStore.update((toasts) => toasts.filter((t) => t.id !== id));
}

export function clearToasts() {
	toastStore.set([]);
}
