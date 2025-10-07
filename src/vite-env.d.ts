/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    supabaseConfig: Record<string, unknown>;
    showNotification: (title: string, body: string) => Promise<void>;
    getVersion: () => Promise<string>;
    onMenuAction: (callback: () => void) => void;
    removeMenuListener: (callback: () => void) => void;
    checkForUpdates: () => Promise<{ success: boolean; message: string }>;
    downloadUpdate: () => Promise<{ success: boolean; message: string }>;
    installUpdate: () => Promise<{ success: boolean; message: string }>;
    onUpdateStatus: (
      callback: (status: string, details: { percent?: number; version?: string; message?: string } | null) => void
    ) => void;
    removeUpdateStatusListener: () => void;
    saveAppData: (filename: string, data: unknown) => Promise<void>;
    loadAppData: (filename: string) => Promise<unknown>;
    getAppDataPath: () => Promise<string>;
    getSession: () => Promise<unknown>;
    setSession: (session: unknown) => Promise<void>;
    deleteSession: () => Promise<void>;
    getLaunchOnStartup: () => Promise<{ success: boolean; openAtLogin?: boolean }>;
    setLaunchOnStartup: (enabled: boolean) => Promise<{ success: boolean; message: string }>;
  };
  ipcRenderer: {
    on: (channel: string, func: (...args: unknown[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
}