const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
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

  const iconPath = VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/icon.ico')
    : path.join(process.resourcesPath || __dirname, 'icon.ico');

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: iconPath,
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
  // Resolve environment paths for both dev (Vite) and local production runs
  // Priority: project root .env.local -> project root .env -> dist-electron sibling .env -> packaged resources .env
  const candidatePaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env'),
    path.join(process.resourcesPath || __dirname, '.env.local'),
    path.join(process.resourcesPath || __dirname, '.env'),
  ];
  const existingEnvPaths = candidatePaths.filter(p => fs.existsSync(p));
  console.log('Resolved env candidates:', candidatePaths);
  console.log('Existing env files:', existingEnvPaths);

  let supabaseConfig = {};

  // Load variables from the first existing env file (prefer .env.local),
  // then continue to load from the rest without overwriting already set keys.
  try {
    existingEnvPaths.forEach((envPath, idx) => {
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
              // Do not overwrite if already set by a higher-priority file
              if (process.env[key] === undefined || process.env[key] === '') {
                process.env[key] = value;
              }
            }
          }
        });
        console.log(`Loaded env file [${idx}]:`, envPath);
      } catch (err) {
        console.warn('Failed to read env file:', envPath, err);
      }
    });

    supabaseConfig = {
      url: process.env.VITE_SUPABASE_URL,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    };

    const hasUrl = Boolean(supabaseConfig.url);
    const hasAnon = Boolean(supabaseConfig.anonKey);
    console.log('Env load complete. Supabase URL present:', hasUrl, 'Anon key present:', hasAnon);
  } catch (error) {
    console.error('Failed to load environment variables:', error);
  }

  createWindow(supabaseConfig);

  // Configure autoUpdater and forward events
  try {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on('checking-for-update', () => {
      win?.webContents.send('update-status', 'checking-for-update');
    });
    autoUpdater.on('update-available', (info) => {
      win?.webContents.send('update-status', 'update-available', info);
    });
    autoUpdater.on('update-not-available', (info) => {
      win?.webContents.send('update-status', 'update-not-available', info);
    });
    autoUpdater.on('error', (err) => {
      win?.webContents.send('update-status', 'error', { message: err?.message || String(err) });
    });
    autoUpdater.on('download-progress', (progressObj) => {
      win?.webContents.send('update-status', 'download-progress', progressObj);
    });
    autoUpdater.on('update-downloaded', (info) => {
      win?.webContents.send('update-status', 'update-downloaded', info);
    });
  } catch (e) {
    console.warn('autoUpdater setup failed:', e);
  }
});

ipcMain.on('get-app-version', (event) => {
  event.reply('app-version', { version: app.getVersion() });
});

// Supabase config handler


// Notification handler
ipcMain.handle('show-notification', (event, title, body) => {
  try {
    const notif = new Notification({ title: String(title), body: String(body) });
    notif.show();
    return { success: true };
  } catch (err) {
    console.error('Failed to show notification:', err);
    return { success: false, message: err?.message || String(err) };
  }
});

// App version handler (using handle instead of on)
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// Update handlers (placeholders)
ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true, message: 'Güncelleme kontrolü başlatıldı' };
  } catch (err) {
    win?.webContents.send('update-status', 'error', { message: err?.message || String(err) });
    return { success: false, message: err?.message || String(err) };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true, message: 'İndirme başlatıldı' };
  } catch (err) {
    win?.webContents.send('update-status', 'error', { message: err?.message || String(err) });
    return { success: false, message: err?.message || String(err) };
  }
});

ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall(false, true);
    return { success: true, message: 'Kurulum başlatıldı' };
  } catch (err) {
    win?.webContents.send('update-status', 'error', { message: err?.message || String(err) });
    return { success: false, message: err?.message || String(err) };
  }
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
