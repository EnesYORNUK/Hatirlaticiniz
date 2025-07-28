const { app, BrowserWindow, Menu, Notification, ipcMain, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Uygulama penceresi ve tray referansı
let mainWindow;
let tray = null;
let notificationTimer = null;

function createWindow() {
  console.log('Electron: createWindow çağrıldı.');
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, 'icon.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.cjs')
      },
      titleBarStyle: 'default',
      show: false
    });
    console.log('Electron: BrowserWindow başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Electron: BrowserWindow oluşturulurken hata oluştu:', error);
    app.quit();
    return;
  }

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
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Pencere kapatılırken sistem tepsisine gizle
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      
      // İlk kez gizlenirken bilgilendirme bildirimi göster
      if (!global.trayNotificationShown) {
        showNotification(
          'Hatırlatıcınım',
          'Uygulama sistem tepsisinde çalışmaya devam ediyor. Tamamen kapatmak için tepsiden çıkış yapın.'
        );
        global.trayNotificationShown = true;
      }
      return false;
    }
  });

  mainWindow.on('closed', () => {
    console.log('Electron: Pencere kapatıldı.');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Electron: Web içeriği yüklenemedi:', errorDescription, validatedURL);
  });

  createMenu();
  createTray();
  setupNotificationTimer();
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

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, 'icon.ico'));
    
    // Mevcut bildirim ayarını kontrol et
    let notificationsEnabled = true;
    try {
      const settingsPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim', 'hatirlatici-settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        notificationsEnabled = settings.notificationsEnabled !== false;
      }
    } catch (error) {
      console.log('Bildirim ayarı okunamadı, default true kullanılıyor');
    }
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Aç',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        }
      },
      {
        label: 'Bildirimler',
        type: 'checkbox',
        checked: notificationsEnabled,
        click: (menuItem) => {
          // Bildirim ayarını kaydet
          saveNotificationSetting(menuItem.checked);
        }
      },
      { type: 'separator' },
      {
        label: 'Güncelleme Kontrol Et',
        click: () => {
          if (!isDev && isAutoUpdateEnabled()) {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('Hatırlatıcınım - Çek ve Fatura Takibi');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      } else {
        createWindow();
      }
    });

  } catch (error) {
    console.error('Tray oluşturulamadı:', error);
  }
}

function setupNotificationTimer() {
  // Arka planda bildirim kontrolü - her 30 dakikada bir
  if (notificationTimer) {
    clearInterval(notificationTimer);
  }

  notificationTimer = setInterval(() => {
    checkBackgroundNotifications();
  }, 30 * 60 * 1000); // 30 dakika

  // İlk kontrol 5 dakika sonra
  setTimeout(() => {
    checkBackgroundNotifications();
  }, 5 * 60 * 1000);
}

function checkBackgroundNotifications() {
  try {
    // Ayarları kontrol et
    const settingsPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim', 'hatirlatici-settings.json');
    const checksPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim', 'hatirlatici-checks.json');

    if (!fs.existsSync(settingsPath) || !fs.existsSync(checksPath)) {
      return;
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const checks = JSON.parse(fs.readFileSync(checksPath, 'utf8'));

    if (!settings.notificationsEnabled) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    checks.forEach(check => {
      if (check.isPaid) return;

      const paymentDate = new Date(check.paymentDate);
      paymentDate.setHours(0, 0, 0, 0);
      
      const daysUntil = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Hatırlatma günü bildirimi
      if (daysUntil === settings.reminderDays) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `${type} Ödeme Hatırlatması`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} ₺ tutarındaki ${type.toLowerCase()}in ödeme tarihi ${settings.reminderDays} gün sonra!`
        );
      }

      // Bugün ödeme günü
      if (daysUntil === 0) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `${type} Ödeme Günü!`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} ₺ tutarındaki ${type.toLowerCase()}in ödeme günü bugün!`
        );
      }

      // Vadesi geçenler (son 3 gün için)
      if (daysUntil < 0 && daysUntil >= -3) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `Vadesi Geçen ${type}!`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} ₺ tutarındaki ${type.toLowerCase()}in vadesi ${Math.abs(daysUntil)} gün önce geçti!`
        );
      }
    });

  } catch (error) {
    console.error('Arka plan bildirim kontrolü hatası:', error);
  }
}

function saveNotificationSetting(enabled) {
  try {
    const settingsPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim', 'hatirlatici-settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      settings.notificationsEnabled = enabled;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }
  } catch (error) {
    console.error('Bildirim ayarı kaydedilemedi:', error);
  }
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

// AppData dosya işlemleri
ipcMain.handle('save-app-data', async (event, key, data) => {
  try {
    const appDataPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
    
    const filePath = path.join(appDataPath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    console.error('AppData kaydetme hatası:', error);
    return false;
  }
});

ipcMain.handle('load-app-data', async (event, key) => {
  try {
    const appDataPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim');
    const filePath = path.join(appDataPath, `${key}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    
    return null;
  } catch (error) {
    console.error('AppData okuma hatası:', error);
    return null;
  }
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
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Sistem tepsisi kullanıldığında tüm pencereler kapatılsa bile app'i kapatma
app.on('window-all-closed', () => {
  // macOS'ta bile sistem tepsisi varsa uygulamayı açık tut
  if (process.platform !== 'darwin' && !tray) {
    app.quit();
  }
});

// Uygulama tamamen kapatılırken temizlik yap
app.on('before-quit', () => {
  app.isQuiting = true;
  
  if (notificationTimer) {
    clearInterval(notificationTimer);
  }
  
  if (tray) {
    tray.destroy();
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
      path.join(require('os').homedir(), 'AppData', 'Roaming', 'Hatirlaticinim', 'hatirlatici-settings.json'),
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