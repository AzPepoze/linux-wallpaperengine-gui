import ColorThief from "colorthief";
import { logger } from "../scripts/logger";

export function getDominantColor(
	base64String: string
): Promise<[number, number, number] | null> {
	return new Promise(async (resolve, reject) => {
		try {
			let src = base64String;
			if (src.startsWith("http")) {
				try {
					src = await window.electronAPI.fetchImage(src);
				} catch (e) {
					console.warn("Failed to fetch image via backend, trying direct load", e);
				}
			}

			const img = new Image();
			img.crossOrigin = "Anonymous";
			img.onload = () => {
				try {
					const colorThief = new ColorThief();
					const dominantColor = colorThief.getColor(img);
					resolve(dominantColor);
				} catch (error) {
					logger.error("Getting dominant color:", error);
					reject(error);
				}
			};
			img.onerror = (error) => {
				logger.error("Loading image for color thief:", error);
				reject(error);
			};
			img.src = src;
		} catch (error) {
			reject(error);
		}
	});
}

export function isLight(color: [number, number, number]): boolean {
	const [r, g, b] = color;
	const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
	return hsp > 127.5;
}

export function getPalette(
	base64String: string,
	colorCount: number = 6
): Promise<[number, number, number][] | null> {
	return new Promise(async (resolve, reject) => {
		try {
			let src = base64String;
			if (src.startsWith("http")) {
				try {
					src = await window.electronAPI.fetchImage(src);
				} catch (e) {
					console.warn("Failed to fetch image via backend, trying direct load", e);
				}
			}

			const img = new Image();
			img.crossOrigin = "Anonymous";
			img.onload = () => {
				try {
					const colorThief = new ColorThief();
					const palette = colorThief.getPalette(img, colorCount);
					resolve(palette);
				} catch (error) {
					logger.error("Getting color palette:", error);
					reject(error);
				}
			};
			img.onerror = (error) => {
				logger.error("Loading image for color thief:", error);
				reject(error);
			};
			img.src = src;
		} catch (error) {
			reject(error);
		}
	});
}

export function rgbToHex(color: [number, number, number]): string {
	const [r, g, b] = color;
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function hexToRgbFloat(hex: string): string {
	let r = 0, g = 0, b = 0;
	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	} else if (hex.length === 7) {
		r = parseInt(hex.substring(1, 3), 16);
		g = parseInt(hex.substring(3, 5), 16);
		b = parseInt(hex.substring(5, 7), 16);
	}
	return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`;
}

export function rgbFloatToHex(rgbFloat: string): string {
	if (!rgbFloat) return "#000000";
	const parts = rgbFloat.split(/\s+/).map(p => parseFloat(p));
	if (parts.length < 3) return "#000000";

	const r = Math.round(Math.max(0, Math.min(1, parts[0])) * 255);
	const g = Math.round(Math.max(0, Math.min(1, parts[1])) * 255);
	const b = Math.round(Math.max(0, Math.min(1, parts[2])) * 255);

	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function adjustBrightness(color: [number, number, number], maxV: number = 0.4): [number, number, number] {
	const r = color[0] / 255;
	const g = color[1] / 255;
	const b = color[2] / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	let h = 0;
	let s = 0;
	let v = max;

	const d = max - min;
	s = max === 0 ? 0 : d / max;

	if (max !== min) {
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	// Cap the brightness (value)
	v = Math.min(v, maxV);

	// Convert back to RGB
	let nr = 0, ng = 0, nb = 0;

	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);

	switch (i % 6) {
		case 0: nr = v; ng = t; nb = p; break;
		case 1: nr = q; ng = v; nb = p; break;
		case 2: nr = p; ng = v; nb = t; break;
		case 3: nr = p; ng = q; nb = v; break;
		case 4: nr = t; ng = p; nb = v; break;
		case 5: nr = v; ng = p; nb = q; break;
	}

	return [
		Math.round(nr * 255),
		Math.round(ng * 255),
		Math.round(nb * 255)
	];
}
