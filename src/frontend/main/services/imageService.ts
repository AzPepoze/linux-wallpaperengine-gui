import { ipcMain, net } from "electron";
import { logger } from "../logger";

// Cache for images to avoid redundant fetches
const imageCache = new Map<string, string>();

export function registerImageService() {
    ipcMain.handle("fetch-image", async (_, url: string) => {
        logger.ipcReceived("fetch-image", url);

        // Check cache first
        if (imageCache.has(url)) {
            return imageCache.get(url);
        }

        const fetchWithRetry = async (
            targetUrl: string,
            retries = 3,
            delay = 1000,
        ) => {
            for (let i = 0; i < retries; i++) {
                try {
                    // Using net.fetch which is Electron's own fetch,
                    // more reliable and respects system proxy settings
                    const response = await net.fetch(targetUrl);
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`,
                        );
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64 = buffer.toString("base64");
                    const mimeType =
                        response.headers.get("content-type") ||
                        "image/jpeg";
                    const dataUrl = `data:${mimeType};base64,${base64}`;

                    // Cache the result
                    imageCache.set(url, dataUrl);
                    // Limit cache size to 100 items
                    if (imageCache.size > 100) {
                        const firstKey = imageCache.keys().next().value;
                        if (typeof firstKey === "string") {
                            imageCache.delete(firstKey);
                        }
                    }

                    return dataUrl;
                } catch (error) {
                    if (i === retries - 1) throw error;
                    logger.warn(
                        `Fetch failed for ${targetUrl}, retrying (${i + 1}/${retries})...`,
                        error,
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, delay * (i + 1)),
                    );
                }
            }
        };

        try {
            return await fetchWithRetry(url);
        } catch (error) {
            logger.error("Error fetching image after retries:", error);
            throw error;
        }
    });
}
