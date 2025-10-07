/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    supabaseConfig: Record<string, any>;
    showNotification: (title: string, body: string) => Promise<void>;
    getVersion: () => Promise<string>;
    onMenuAction: (callback: () => void) => void;
    removeMenuListener: (callback: () => void) => void;
    checkForUpdates: () => Promise<{ success: boolean; message: string }>;
    downloadUpdate: () => Promise<{ success: boolean; message: string }>;
    installUpdate: () => Promise<{ success: boolean; message: string }>;
    onUpdateStatus: (callback: (status: string, details: any) => void) => void;
    removeUpdateStatusListener: () => void;
    saveAppData: (filename: string, data: any) => Promise<void>;
    loadAppData: (filename: string) => Promise<any>;
    getAppDataPath: () => Promise<string>;
    getSession: () => Promise<any>;
    setSession: (session: any) => Promise<void>;
    deleteSession: () => Promise<void>;
  };
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
}