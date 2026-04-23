import { getDominantColor, isLight, adjustBrightness } from '@/utils/colorHelper';
import type { SettingsState } from '@/scripts/settings/settings';
import type { Wallpaper } from '@shared/types';

export async function applyDynamicTheme(
    selectedWallpaper: Wallpaper | null,
    settings: SettingsState | null
) {
    if (settings?.dynamicUiTheme && selectedWallpaper?.previewPath) {
        const dominantColor = await getDominantColor(selectedWallpaper.previewPath);
        if (dominantColor) {
            const cappedBgColor = adjustBrightness(dominantColor, 0.4);
            const isLightCol = isLight(cappedBgColor);

            const alpha = settings?.transparentUi
                ? (settings.uiTransparency ?? 80) / 100
                : 1;
            const bgAppCSS = `rgba(${cappedBgColor.join(',')}, ${alpha})`;
            const rawBgOrig = `rgb(${dominantColor.join(',')})`;

            const text = isLightCol ? 'rgba(0,0,0,0.87)' : 'rgba(255,255,255,0.87)';
            const textInverse = isLightCol ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';

            const root = document.documentElement;
            root.style.setProperty('--bg-app', bgAppCSS);
            root.style.setProperty('--text-color', text);
            root.style.setProperty('--text-inverse', textInverse);
            root.style.setProperty(
                '--text-muted',
                isLightCol ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
            );

            // Modal Backgrounds
            const mixColorBg = isLightCol ? 'black' : 'white';
            root.style.setProperty(
                '--bg-modal',
                `color-mix(in srgb, rgb(${cappedBgColor.join(',')}), ${mixColorBg} 10%)`
            );
            root.style.setProperty(
                '--bg-dropdown',
                `color-mix(in srgb, rgb(${cappedBgColor.join(',')}), black 40%)`
            );

            // Interactive surfaces
            const surfaceBaseStr = `rgb(${cappedBgColor.join(',')})`;
            root.style.setProperty(
                '--bg-surface',
                `color-mix(in srgb, ${surfaceBaseStr}, black 40%)`
            );
            root.style.setProperty(
                '--bg-surface-hover',
                `color-mix(in srgb, ${surfaceBaseStr}, black 30%)`
            );
            root.style.setProperty(
                '--bg-surface-active',
                `color-mix(in srgb, ${surfaceBaseStr}, black 20%)`
            );

            // Primary buttons
            const mixColorRaw = isLight(dominantColor) ? 'black' : 'white';
            root.style.setProperty(
                '--btn-primary-bg',
                `color-mix(in srgb, ${rawBgOrig}, ${mixColorRaw} 30%)`
            );
            root.style.setProperty(
                '--btn-primary-hover-bg',
                `color-mix(in srgb, ${rawBgOrig}, ${mixColorRaw} 40%)`
            );

            // Expose raw RGB
            root.style.setProperty('--primary-raw-rgb', dominantColor.join(','));

            // Secondary buttons and borders
            const cappedBgStr = `rgb(${cappedBgColor.join(',')})`;
            const mixColor = isLightCol ? 'black' : 'white';
            root.style.setProperty(
                '--btn-secondary-bg',
                `color-mix(in srgb, ${cappedBgStr}, ${mixColor} 15%)`
            );
            root.style.setProperty(
                '--btn-secondary-hover-bg',
                `color-mix(in srgb, ${cappedBgStr}, ${mixColor} 25%)`
            );

            root.style.setProperty(
                '--border-color',
                `color-mix(in srgb, ${cappedBgStr}, ${mixColor} 15%)`
            );
            root.style.setProperty(
                '--border-color-hover',
                `color-mix(in srgb, ${cappedBgStr}, ${mixColor} 25%)`
            );
        }
    } else {
        resetTheme(settings);
    }
}

export function resetTheme(settings: SettingsState | null) {
    const root = document.documentElement;
    const alpha = settings?.transparentUi
        ? (settings.uiTransparency ?? 80) / 100
        : 1;
    root.style.setProperty('--bg-app', `rgba(29, 29, 29, ${alpha})`);
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--text-inverse');
    root.style.removeProperty('--text-muted');
    root.style.removeProperty('--bg-surface');
    root.style.removeProperty('--bg-surface-hover');
    root.style.removeProperty('--bg-surface-active');
    root.style.removeProperty('--bg-modal');
    root.style.removeProperty('--bg-dropdown');
    root.style.removeProperty('--btn-primary-bg');
    root.style.removeProperty('--btn-primary-hover-bg');
    root.style.removeProperty('--btn-secondary-bg');
    root.style.removeProperty('--btn-secondary-hover-bg');
    root.style.removeProperty('--border-color');
    root.style.removeProperty('--border-color-hover');
    root.style.removeProperty('--primary-raw-rgb');
}
