import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSupabaseConfig: () => ipcRenderer.invoke('get-supabase-config'),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
  getVersion: () => ipcRenderer.invoke('app-version'),
  onMenuAction: (callback: () => void) => {
    ipcRenderer.on('menu-new-check', callback);
  },
  removeMenuListener: (callback: () => void) => {
    ipcRenderer.removeListener('menu-new-check', callback);
  },
  // Update APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (status: string, details: string) => void) => {
    ipcRenderer.on('update-status', (_event, status, details) => {
      callback(status, details);
    });
  },
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  },
  // AppData file operations
  saveAppData: (filename: string, data: any) => ipcRenderer.invoke('save-app-data', filename, data),
  loadAppData: (filename: string) => ipcRenderer.invoke('load-app-data', filename),
  // AppData path
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  // Supabase session management
  getSession: () => ipcRenderer.invoke('get-session'),
  setSession: (session: any) => ipcRenderer.invoke('set-session', session),
  deleteSession: () => ipcRenderer.invoke('delete-session'),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, func: (...args: any[]) => void) => {
    if (['update-status'].includes(channel)) {
      ipcRenderer.on(channel, func);
    }
  },
  removeAllListeners: (channel: string) => {
    if (['update-status'].includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});
