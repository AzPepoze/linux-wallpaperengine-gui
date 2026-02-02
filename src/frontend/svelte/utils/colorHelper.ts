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
