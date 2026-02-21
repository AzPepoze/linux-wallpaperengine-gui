export function addTimestamp(message: string): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");

	const timestamp = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
	return `${timestamp} ${message}`;
}

export function cleanLog(...args: any[]) {
	const message = args
		.map((arg) =>
			typeof arg === "object"
				? JSON.stringify(arg, null, 2)
				: String(arg)
		)
		.join(" ");

	return message;
}
