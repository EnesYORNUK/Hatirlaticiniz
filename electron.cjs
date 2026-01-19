const { app, BrowserWindow, ipcMain, Notification, Tray, Menu } = require('electron');
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
let tray;

// Ensure single instance across launches
const gotTheLock = app.requestSingleInstanceLock();

// Set App User Model ID for Windows Notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.hatirlaticiniz.app');
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
    } else {
      // If no window, create one with default config (env will be loaded on ready)
      // Actual creation happens in whenReady handler below
    }
  });
}

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
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading file:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    win.loadFile(indexPath);
  }

  // Hide to tray on close/minimize
  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on('minimize', (e) => {
    e.preventDefault();
    win.hide();
  });
}

app.on('window-all-closed', () => {
  // Uygulama arkaplanda çalışmaya devam etsin
  win = null;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.disableHardwareAcceleration();
app.whenReady().then(() => {
  // Attempt lightweight migration from legacy userData folders if current is empty
  try {
    const currentUserData = app.getPath('userData');
    const parentDir = path.dirname(currentUserData);
    const currentBase = path.basename(currentUserData);
    const candidates = ['Hatirlaticiniz', 'Hatirlaticinim'].filter(n => n !== currentBase);
    const isDirEmpty = (p) => {
      try { return fs.existsSync(p) && fs.readdirSync(p).length === 0; } catch { return true; }
    };
    if (isDirEmpty(currentUserData)) {
      for (const name of candidates) {
        const legacyPath = path.join(parentDir, name);
        if (fs.existsSync(legacyPath)) {
          try {
            // Shallow copy of files and subfolders (best effort)
            const copyRecursiveSync = (src, dest) => {
              if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
              for (const entry of fs.readdirSync(src)) {
                const s = path.join(src, entry);
                const d = path.join(dest, entry);
                const stat = fs.lstatSync(s);
                if (stat.isDirectory()) copyRecursiveSync(s, d);
                else fs.copyFileSync(s, d);
              }
            };
            copyRecursiveSync(legacyPath, currentUserData);
            console.log('Migrated userData from legacy path:', legacyPath, 'to', currentUserData);
            break;
          } catch (e) {
            console.warn('Migration failed from', legacyPath, '->', currentUserData, e);
          }
        }
      }
    }
  } catch (e) {
    console.warn('userData migration check failed:', e);
  }

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

  // Create tray to keep app running in background
  try {
    const iconPath = VITE_DEV_SERVER_URL
      ? path.join(__dirname, '../public/icon.ico')
      : path.join(process.resourcesPath || __dirname, 'icon.ico');
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Göster', click: () => { if (win) { win.show(); } else { createWindow(supabaseConfig); } } },
      { label: 'Çıkış', click: () => { app.isQuiting = true; app.quit(); } },
    ]);
    tray.setToolTip('Hatırlatıcınız');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => { if (win) { win.show(); } else { createWindow(supabaseConfig); } });
  } catch (e) {
    console.warn('Tray setup failed:', e);
  }

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

// Auto-launch handlers
ipcMain.handle('get-launch-on-startup', () => {
  try {
    const settings = app.getLoginItemSettings();
    return { success: true, openAtLogin: !!settings.openAtLogin };
  } catch (err) {
    return { success: false, message: err?.message || String(err) };
  }
});

ipcMain.handle('set-launch-on-startup', (_event, enable) => {
  try {
    app.setLoginItemSettings({ openAtLogin: !!enable });
    return { success: true };
  } catch (err) {
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
