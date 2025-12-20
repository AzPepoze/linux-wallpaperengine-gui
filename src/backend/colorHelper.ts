import ColorThief from "colorthief";

export function getDominantColor(
     base64String: string
): Promise<[number, number, number] | null> {
     return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
               try {
                    const colorThief = new ColorThief();
                    const dominantColor = colorThief.getColor(img);
                    resolve(dominantColor);
               } catch (error) {
                    console.error("Error getting dominant color:", error);
                    reject(error);
               }
          };
          img.onerror = (error) => {
               console.error("Error loading image for color thief:", error);
               reject(error);
          };
          img.src = base64String;
     });
}

export function isLight(color: [number, number, number]): boolean {
     const [r, g, b] = color;
     const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
     return hsp > 127.5;
}
