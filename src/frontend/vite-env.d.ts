/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ElectronAPI {
     on: (channel: string, callback: (data: any) => void) => void;
     exit: () => Promise<void>;
     minimize: () => Promise<void>;
     maximize: () => Promise<void>;
     hide: () => Promise<void>;
     getScreens: () => Promise<Electron.Display[]>;
     execCommand: (
          command: string,
          args?: string[],
          show_log?: boolean
     ) => Promise<any>;
     readDirectory: (
          path: string
     ) => Promise<{ entry: string; type: "DIRECTORY" | "FILE" }[]>;
     readFile: (path: string) => Promise<string>;
     writeFile: (path: string, content: string) => Promise<void>;
     readBinaryFile: (path: string) => Promise<ArrayBuffer>;
     getEnv: (key: string) => Promise<string | undefined>;
     getHomeDir: () => Promise<string>;
}

interface Window {
     electronAPI: ElectronAPI;
}
