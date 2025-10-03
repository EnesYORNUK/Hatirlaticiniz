// public/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSupabaseConfig: () => ipcRenderer.invoke('get-supabase-config'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  getVersion: () => ipcRenderer.invoke('app-version'),
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-check', callback);
  },
  removeMenuListener: (callback) => {
    ipcRenderer.removeListener('menu-new-check', callback);
  },
  // Güncelleme API'leri
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => {
    // Update status event'lerini dinle
    ipcRenderer.on('update-status', (event, status, info) => {
      callback(status, info);
    });
  },
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  },
  // AppData dosya işlemleri
  saveAppData: (key, data) => ipcRenderer.invoke('save-app-data', key, data),
  loadAppData: (key) => ipcRenderer.invoke('load-app-data', key),
  // AppData path
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  // Supabase session management
  getSession: () => ipcRenderer.invoke('get-session'),
  setSession: (session) => ipcRenderer.invoke('set-session', session),
  deleteSession: () => ipcRenderer.invoke('delete-session'),
});

// IPC Renderer'ı da expose et (event listening için)
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, callback) => {
    const allowedChannels = ['update-status'];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  removeAllListeners: (channel) => {
    const allowedChannels = ['update-status'];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});
