export function addTimestamp(message: string): string {
     const timestamp = new Date().toISOString();
     return `[${timestamp}] ${message}`;
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
