import { writable } from 'svelte/store';

export type ApplyNoticeType = 'success' | 'error';

export interface ApplyNotice {
	id: number;
	message: string;
	type: ApplyNoticeType;
}

export const applyNotice = writable<ApplyNotice | null>(null);

let nextId = 0;

// A new id restarts the pill even when the message text is the same
export function showApplyNotice(message: string, type: ApplyNoticeType = 'success') {
	nextId += 1;
	applyNotice.set({ id: nextId, message, type });
}
