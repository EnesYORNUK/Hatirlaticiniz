// public/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  getVersion: () => ipcRenderer.invoke('app-version'),
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-check', callback);
  },
  removeMenuListener: (callback) => {
    ipcRenderer.removeListener('menu-new-check', callback);
  },
  // Yeni güncelleme API'leri
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, status, info) => callback(status, info)),
});
