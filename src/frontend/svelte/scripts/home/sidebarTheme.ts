import {
	getDominantColor,
	isLight,
	getPaletteColor,
	adjustBrightness
} from '@/utils/colorHelper';
import type { Wallpaper } from '@shared/types';
import type { SettingsState } from '@/scripts/settings/settings';

export interface SidebarTheme {
	backgroundColor: string;
	textColor: string;
	palette: [number, number, number][];
	btnPrimaryTextColor: string;
	accentColor: [number, number, number] | null;
}

export const DEFAULT_THEME: SidebarTheme = {
	backgroundColor: 'var(--bg-dropdown)',
	textColor: 'rgba(255, 255, 255, 0.87)',
	palette: [],
	btnPrimaryTextColor: 'var(--bg-dropdown)',
	accentColor: null
};

export async function calculateSidebarTheme(
	wallpaper: Wallpaper,
	settings: SettingsState | null
): Promise<SidebarTheme> {
	if (!settings?.dynamicSidebarTheme || !wallpaper.previewPath) {
		return DEFAULT_THEME;
	}

	const theme: SidebarTheme = { ...DEFAULT_THEME };

	try {
		const dominantColor = await getDominantColor(wallpaper.previewPath);
		if (dominantColor) {
			const cappedBg = adjustBrightness(dominantColor, 0.3);
			theme.backgroundColor = `rgb(${Math.round(cappedBg[0])}, ${Math.round(cappedBg[1])}, ${Math.round(cappedBg[2])})`;
			theme.textColor = isLight(cappedBg)
				? 'rgba(0, 0, 0, 0.87)'
				: 'rgba(255, 255, 255, 0.87)';

			const palette = await getPaletteColor(wallpaper.previewPath, 8);
			if (palette) {
				theme.palette = palette;
				const targetIsLight = !isLight(dominantColor);
				const contrastingColor = palette.find(
					(c) => isLight(c) === targetIsLight
				);

				if (contrastingColor) {
					theme.accentColor = contrastingColor;
				} else {
					theme.accentColor = targetIsLight ? [255, 255, 255] : [0, 0, 0];
				}

				if (theme.accentColor) {
					theme.btnPrimaryTextColor = isLight(theme.accentColor)
						? 'rgba(0, 0, 0, 0.87)'
						: 'rgba(255, 255, 255, 0.87)';
				} else {
					theme.btnPrimaryTextColor = theme.backgroundColor;
				}
			}
		}
	} catch (e) {
		console.error('Failed to calculate sidebar theme:', e);
	}

	return theme;
}
