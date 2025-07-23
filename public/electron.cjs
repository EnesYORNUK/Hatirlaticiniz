const { app, BrowserWindow, Menu, Notification, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater'); // Bu satırı ekleyin
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';


// Uygulama penceresi referansı
let mainWindow;

function createWindow() {
  console.log('Electron: createWindow çağrıldı.');
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, 'icon.ico'), // Bu satırın 'icon.ico' olduğundan emin olun
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.cjs')
      },
      titleBarStyle: 'default',
      show: false
    });
    console.log('Electron: BrowserWindow başarıyla oluşturuldu.'); // Başarılı oluşturma mesajı
  } catch (error) {
    console.error('Electron: BrowserWindow oluşturulurken hata oluştu:', error); // Hata mesajı
    // Hata durumunda uygulamayı kapatmak isteyebilirsiniz
    app.quit();
    return; // Hata durumunda fonksiyonu sonlandır
  }

  // ... geri kalan kod (mainWindow.once, mainWindow.loadURL vb.) ...
  // Bu kodlar artık try bloğunun dışında olacak, ancak mainWindow'un tanımlı olduğundan emin olmak için
  // try-catch bloğundan sonra gelmeli.
  // Eğer mainWindow null veya undefined ise, bu kodlar çalışmayacaktır.
  if (!mainWindow) {
    console.error('Electron: mainWindow hala tanımlı değil, uygulama kapatılıyor.');
    app.quit();
    return;
  }

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  console.log('Electron: Yüklenecek URL:', startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    console.log('Electron: Pencere gösterilmeye hazır.');
    mainWindow.show();
    // Geliştirme modunda DevTools'u aç
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  });

  mainWindow.on('closed', () => {
    console.log('Electron: Pencere kapatıldı.');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Electron: Web içeriği yüklenemedi:', errorDescription, validatedURL);
  });
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Electron: Render süreci çöktü veya kapandı:', details);
  });
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Electron: Render süreci çöktü. Killed:', killed);
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Çek',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-check');
          }
        },
        { type: 'separator' },
        {
          label: 'Çıkış',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Düzenle',
      submenu: [
        { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Yinele', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yeniden Yükle', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Tam Ekran', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Yakınlaştır', accelerator: 'CmdOrCtrl+Plus', role: 'zoomin' },
        { label: 'Uzaklaştır', accelerator: 'CmdOrCtrl+-', role: 'zoomout' },
        { label: 'Gerçek Boyut', accelerator: 'CmdOrCtrl+0', role: 'resetzoom' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: () => {
            const options = {
              type: 'info',
              title: 'Hatırlatıcınım Hakkında',
              message: 'Hatırlatıcınım v1.0.0',
              detail: 'Çek takip ve hatırlatma uygulaması\n\nGeliştirici: Hatırlatıcınım Ekibi'
            };
            require('electron').dialog.showMessageBox(mainWindow, options);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Bildirim gönderme fonksiyonu
function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, 'icon.ico')
    }).show();
  }
}

// IPC olayları
ipcMain.handle('show-notification', async (event, title, body) => {
  showNotification(title, body);
});

ipcMain.handle('app-version', async () => {
  return app.getVersion();
});

// Uygulama olayları
app.whenReady().then(() => {
  createWindow();

  // Geliştirme modunda güncelleme kontrolü yapma
  if (!isDev) {
    // Uygulama başladığında güncelleme kontrol et (2 saniye sonra)
    setTimeout(() => {
      if (isAutoUpdateEnabled()) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    }, 2000);

    // Her 30 dakikada bir güncelleme kontrol et
    setInterval(() => {
      if (isAutoUpdateEnabled()) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    }, 30 * 60 * 1000); // 30 dakika
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Güvenlik: Yeni pencere açılmasını engelle
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// Güncelleme olaylarını dinle
autoUpdater.autoDownload = false; // Otomatik indirmeyi kapat
autoUpdater.autoInstallOnAppQuit = false; // Uygulama kapanırken otomatik kurulumu kapat

// Kullanıcı ayarlarını kontrol eden fonksiyon
function isAutoUpdateEnabled() {
  try {
    const settings = JSON.parse(require('fs').readFileSync(
      path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim', 'settings.json'),
      'utf8'
    ));
    return settings.autoUpdateEnabled !== false; // Default true
  } catch (error) {
    return true; // Ayar yoksa default true
  }
}

autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-status', 'update-available', info);
});

autoUpdater.on('update-not-available', () => {
  mainWindow.webContents.send('update-status', 'update-not-available');
});

autoUpdater.on('error', (err) => {
  mainWindow.webContents.send('update-status', 'error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('update-status', 'download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('update-status', 'update-downloaded', info);
});

// Renderer sürecinden gelen IPC çağrılarını dinle
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    const result = await autoUpdater.downloadUpdate();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});