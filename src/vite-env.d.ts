/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    showNotification: (title: string, body: string) => Promise<void>;
    checkForUpdates: () => Promise<{ success: boolean; message: string; }>;
    downloadUpdate: () => Promise<{ success: boolean; message: string; }>;
    installUpdate: () => Promise<void>;
    getVersion: () => Promise<string>;
    saveAppData: (key: string, data: any) => Promise<void>;
    loadAppData: (key: string) => Promise<any>;
    getAppDataPath: () => Promise<string>;
    getSession: (key: string) => Promise<any>;
    setSession: (key: string, value: any) => Promise<void>;
    deleteSession: (key: string) => Promise<void>;
  };
}