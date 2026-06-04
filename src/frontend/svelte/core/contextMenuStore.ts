import { writable } from 'svelte/store';

export interface ContextMenuItem {
	label: string;
	icon?: string;
	action?: () => void;
	danger?: boolean;
	disabled?: boolean;
	divider?: boolean;
	subMenu?: ContextMenuItem[];
}

export interface ContextMenuState {
	x: number;
	y: number;
	items: ContextMenuItem[];
	visible: boolean;
}

export const contextMenuStore = writable<ContextMenuState>({
	x: 0,
	y: 0,
	items: [],
	visible: false
});

export function showContextMenu(x: number, y: number, items: ContextMenuItem[]) {
	contextMenuStore.set({ x, y, items, visible: true });
}

export function hideContextMenu() {
	contextMenuStore.update((s) => ({ ...s, visible: false }));
}
