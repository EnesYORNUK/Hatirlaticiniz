import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.DIST_ELECTRON = path.join(__dirname, '../dist-electron');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'dist-electron/preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    console.log('Renderer process finished loading');
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  win.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer console:', message);
  });

  if (VITE_DEV_SERVER_URL) {
    console.log('Loading dev server URL:', VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading file:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    win.loadFile(indexPath);
    win.webContents.openDevTools();
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.setPath('userData', path.join(__dirname, 'electron-data'));
app.disableHardwareAcceleration();
app.whenReady().then(createWindow);

ipcMain.on('get-app-version', (event) => {
  event.reply('app-version', { version: app.getVersion() });
});

// Supabase config handler
ipcMain.handle('get-supabase-config', () => {
  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY
  };
});

// Notification handler
ipcMain.handle('show-notification', (event, title, body) => {
  // Notification implementation can be added here
  console.log('Notification:', title, body);
});

// App version handler (using handle instead of on)
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// Update handlers (placeholders)
ipcMain.handle('check-for-updates', () => {
  console.log('Check for updates requested');
});

ipcMain.handle('download-update', () => {
  console.log('Download update requested');
});

ipcMain.handle('install-update', () => {
  console.log('Install update requested');
});

// AppData handlers (placeholders)
ipcMain.handle('save-app-data', (event, filename, data) => {
  console.log('Save app data:', filename);
});

ipcMain.handle('load-app-data', (event, filename) => {
  console.log('Load app data:', filename);
});

ipcMain.handle('get-app-data-path', () => {
  return app.getPath('userData');
});

// Session handlers (placeholders)
ipcMain.handle('get-session', () => {
  console.log('Get session requested');
  return null;
});

ipcMain.handle('set-session', (event, session) => {
  console.log('Set session requested');
});

ipcMain.handle('delete-session', () => {
  console.log('Delete session requested');
});
