export function formatBytes(bytes: number | undefined): string {
	if (bytes === undefined || bytes === 0) return "Unknown";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(timestamp: number | undefined): string {
	if (!timestamp) return "Unknown";
	return new Date(timestamp * 1000).toLocaleDateString();
}
