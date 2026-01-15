import net from "node:net";
import path from "node:path";
import os from "node:os";

interface Request {
	id: number;
	method: string;
	params: any;
}

interface Response {
	id?: number;
	method?: string;
	result?: any;
	params?: any;
	error?: string;
}

class SocketClient {
	private socketPath: string;
	private client: net.Socket | null = null;
	private nextId = 1;
	private pendingRequests = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();
	private buffer = "";
	private eventListener: ((method: string, params: any) => void) | null = null;

	constructor() {
		this.socketPath = path.join(
               os.tmpdir(),
               "linux-wallpaperengine-gui.sock"
          );
	}

	onEvent(callback: (method: string, params: any) => void) {
		this.eventListener = callback;
	}

	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.client = net.createConnection(this.socketPath, () => {
				console.log("Connected to Go backend socket");
				resolve();
			});

			this.client.on("data", (data) => {
				this.buffer += data.toString();
				this.processBuffer();
			});

			this.client.on("error", (err) => {
				console.error("Socket error:", err);
				reject(err);
			});

			this.client.on("close", () => {
				console.log("Socket connection closed");
				this.client = null;
			});
		});
	}

	private processBuffer() {
		const lines = this.buffer.split("\n");
		this.buffer = lines.pop() || "";

		for (const line of lines) {
			if (!line.trim()) continue;
			try {
				const response: Response = JSON.parse(line);
				
				if (response.id === undefined) {
					// This is an event
					if (this.eventListener && response.method) {
						this.eventListener(response.method, response.params);
					}
					continue;
				}

				const pending = this.pendingRequests.get(response.id);
				if (pending) {
					if (response.error) {
						pending.reject(new Error(response.error));
					} else {
						pending.resolve(response.result);
					}
					this.pendingRequests.delete(response.id);
				}
			} catch (e) {
				console.error("Error parsing response:", e);
			}
		}
	}

	async send(method: string, params: any = {}): Promise<any> {
		if (!this.client) {
			throw new Error("Socket client not connected");
		}

		const id = this.nextId++;
		const request: Request = { id, method, params };

		return new Promise((resolve, reject) => {
			this.pendingRequests.set(id, { resolve, reject });
			this.client?.write(JSON.stringify(request) + "\n");
		});
	}
}

export const socketClient = new SocketClient();
