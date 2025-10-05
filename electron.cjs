const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

const __dirname = path.dirname(__filename);
process.env.DIST_ELECTRON = path.join(__dirname, '../dist-electron');

// Load environment variables from .env file
// Production build'de electron.cjs zaten dist-electron klasöründe olduğu için
// .env dosyası yolunu buna göre ayarlıyoruz
let win;

function createWindow(supabaseConfig) {
  console.log('Creating window with supabaseConfig:', supabaseConfig);
  const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

  const preloadPath = VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../dist-electron/preload.cjs')
    : path.join(__dirname, 'preload.cjs');

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments: [`--supabase-config=${JSON.stringify(supabaseConfig)}`],
    },
  });

  console.log('Additional arguments:', win.webContents.additionalArguments);

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
app.whenReady().then(() => {
  const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
  // Resolve .env path robustly for both dev and local production runs
  // Priority: project root .env -> dist-electron sibling .env -> packaged resources .env
  let envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    const altPath = path.join(__dirname, '.env');
    envPath = fs.existsSync(altPath) ? altPath : path.join(process.resourcesPath || __dirname, '.env');
  }
  console.log('Resolved .env path:', envPath, 'exists:', fs.existsSync(envPath));

  let supabaseConfig = {};
  try {
    const envFileContent = fs.readFileSync(envPath, 'utf8');
    envFileContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      }
    });
    supabaseConfig = {
      url: process.env.VITE_SUPABASE_URL,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    };
    console.log('.env file loaded and parsed successfully.');
    console.log('Supabase URL present:', Boolean(supabaseConfig.url), 'Anon key present:', Boolean(supabaseConfig.anonKey));
  } catch (error) {
    console.error('Failed to load .env file:', error);
  }

  createWindow(supabaseConfig);
});

ipcMain.on('get-app-version', (event) => {
  event.reply('app-version', { version: app.getVersion() });
});

// Supabase config handler


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
