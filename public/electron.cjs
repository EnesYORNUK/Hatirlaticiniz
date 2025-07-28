const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const TelegramBot = require('node-telegram-bot-api');

let mainWindow;
let tray = null;
let telegramBot = null;
let isQuitting = false;
let backgroundNotificationInterval = null;

// AppData klasör yolu
const getAppDataPath = () => {
  const platform = process.platform;
  switch (platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Hatirlaticinim');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Hatirlaticinim');
    default:
      return path.join(os.homedir(), '.config', 'Hatirlaticinim');
  }
};

// Telegram Bot Fonksiyonları
function initializeTelegramBot() {
  try {
    const settingsPath = path.join(getAppDataPath(), 'hatirlatici-settings.json');
    if (!fs.existsSync(settingsPath)) return;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    
    if (!settings.telegramBotEnabled || !settings.telegramBotToken) {
      if (telegramBot) {
        telegramBot.stopPolling();
        telegramBot = null;
      }
      return;
    }

    // Mevcut bot'u durdur
    if (telegramBot) {
      telegramBot.stopPolling();
    }

    // Yeni bot oluştur
    telegramBot = new TelegramBot(settings.telegramBotToken, { polling: true });
    
    console.log('Telegram bot başlatıldı');
    setupTelegramCommands();
    
  } catch (error) {
    console.error('Telegram bot başlatılamadı:', error);
  }
}

function setupTelegramCommands() {
  if (!telegramBot) return;

  // /start komutu
  telegramBot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `🤖 Hatırlatıcınım Bot'a hoş geldiniz!

📋 Kullanılabilir komutlar:
/bugun - Bugün ödenecek çek/faturalar
/yakin - 7 gün içinde ödenecekler
/tumu - Tüm aktif ödemeler
/gecmis - Vadesi geçen ödemeler
/istatistik - Genel özet

💡 Chat ID'niz: ${chatId}
Bu ID'yi uygulamanın ayarlarına girin.`;

    telegramBot.sendMessage(chatId, welcomeMessage);
  });

  // /bugun komutu
  telegramBot.onText(/\/bugun/, (msg) => {
    const chatId = msg.chat.id;
    sendTodayPayments(chatId);
  });

  // /yakin komutu
  telegramBot.onText(/\/yakin/, (msg) => {
    const chatId = msg.chat.id;
    sendUpcomingPayments(chatId);
  });

  // /tumu komutu
  telegramBot.onText(/\/tumu/, (msg) => {
    const chatId = msg.chat.id;
    sendAllActivePayments(chatId);
  });

  // /gecmis komutu
  telegramBot.onText(/\/gecmis/, (msg) => {
    const chatId = msg.chat.id;
    sendOverduePayments(chatId);
  });

  // /istatistik komutu
  telegramBot.onText(/\/istatistik/, (msg) => {
    const chatId = msg.chat.id;
    sendStatistics(chatId);
  });

  // Error handler
  telegramBot.on('error', (error) => {
    console.error('Telegram bot hatası:', error);
  });
}

function getChecksData() {
  try {
    const checksPath = path.join(getAppDataPath(), 'hatirlatici-checks.json');
    if (!fs.existsSync(checksPath)) return [];
    
    const data = fs.readFileSync(checksPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Checks verisi okunamadı:', error);
    return [];
  }
}

function formatCheck(check) {
  const type = check.type === 'bill' ? '🧾 Fatura' : '📄 Çek';
  const typeDetails = check.type === 'bill' && check.billType 
    ? ` (${check.billType.charAt(0).toUpperCase() + check.billType.slice(1)})`
    : '';
  
  const amount = check.amount.toLocaleString('tr-TR');
  const date = new Date(check.paymentDate).toLocaleDateString('tr-TR');
  const daysLeft = Math.ceil((new Date(check.paymentDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  let status = '';
  if (check.isPaid) {
    status = '✅ Ödendi';
  } else if (daysLeft < 0) {
    status = `⚠️ ${Math.abs(daysLeft)} gün gecikmiş`;
  } else if (daysLeft === 0) {
    status = '🔴 Bugün ödenecek';
  } else {
    status = `⏰ ${daysLeft} gün kaldı`;
  }

  return `${type}${typeDetails}
💰 ${amount} TL
🏢 ${check.signedTo}
📅 ${date}
${status}`;
}

function sendTodayPayments(chatId) {
  const checks = getChecksData();
  const today = new Date().toDateString();
  
  const todayChecks = checks.filter(check => {
    if (check.isPaid) return false;
    const checkDate = new Date(check.paymentDate).toDateString();
    return checkDate === today;
  });

  if (todayChecks.length === 0) {
    telegramBot.sendMessage(chatId, '🎉 Bugün ödenecek çek/fatura yok!');
    return;
  }

  let message = `📅 Bugün ödenecek ${todayChecks.length} ödeme:\n\n`;
  todayChecks.forEach((check, index) => {
    message += `${index + 1}. ${formatCheck(check)}\n\n`;
  });

  telegramBot.sendMessage(chatId, message);
}

function sendUpcomingPayments(chatId) {
  const checks = getChecksData();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingChecks = checks.filter(check => {
    if (check.isPaid) return false;
    const checkDate = new Date(check.paymentDate);
    const now = new Date();
    return checkDate >= now && checkDate <= sevenDaysFromNow;
  });

  if (upcomingChecks.length === 0) {
    telegramBot.sendMessage(chatId, '😌 Önümüzdeki 7 gün içinde ödenecek çek/fatura yok!');
    return;
  }

  // Tarihe göre sırala
  upcomingChecks.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

  let message = `⏰ 7 gün içinde ödenecek ${upcomingChecks.length} ödeme:\n\n`;
  upcomingChecks.forEach((check, index) => {
    message += `${index + 1}. ${formatCheck(check)}\n\n`;
  });

  telegramBot.sendMessage(chatId, message);
}

function sendAllActivePayments(chatId) {
  const checks = getChecksData();
  const activeChecks = checks.filter(check => !check.isPaid);

  if (activeChecks.length === 0) {
    telegramBot.sendMessage(chatId, '🎉 Hiç aktif ödeme yok! Tüm ödemeler tamamlanmış.');
    return;
  }

  // Tarihe göre sırala
  activeChecks.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

  let message = `📋 Toplam ${activeChecks.length} aktif ödeme:\n\n`;
  activeChecks.slice(0, 10).forEach((check, index) => {
    message += `${index + 1}. ${formatCheck(check)}\n\n`;
  });

  if (activeChecks.length > 10) {
    message += `... ve ${activeChecks.length - 10} ödeme daha.`;
  }

  telegramBot.sendMessage(chatId, message);
}

function sendOverduePayments(chatId) {
  const checks = getChecksData();
  const now = new Date();
  
  const overdueChecks = checks.filter(check => {
    if (check.isPaid) return false;
    const checkDate = new Date(check.paymentDate);
    return checkDate < now;
  });

  if (overdueChecks.length === 0) {
    telegramBot.sendMessage(chatId, '✅ Vadesi geçmiş ödeme yok!');
    return;
  }

  // Tarihe göre sırala (en eski önce)
  overdueChecks.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

  let message = `⚠️ Vadesi geçmiş ${overdueChecks.length} ödeme:\n\n`;
  overdueChecks.forEach((check, index) => {
    message += `${index + 1}. ${formatCheck(check)}\n\n`;
  });

  telegramBot.sendMessage(chatId, message);
}

function sendStatistics(chatId) {
  const checks = getChecksData();
  
  const total = checks.length;
  const paid = checks.filter(c => c.isPaid).length;
  const active = checks.filter(c => !c.isPaid).length;
  const overdue = checks.filter(c => !c.isPaid && new Date(c.paymentDate) < new Date()).length;
  
  const totalAmount = checks.reduce((sum, c) => sum + c.amount, 0);
  const paidAmount = checks.filter(c => c.isPaid).reduce((sum, c) => sum + c.amount, 0);
  const activeAmount = checks.filter(c => !c.isPaid).reduce((sum, c) => sum + c.amount, 0);

  const message = `📊 Genel İstatistikler:

📋 Toplam Kayıt: ${total}
✅ Ödenen: ${paid}
⏳ Aktif: ${active}
⚠️ Vadesi Geçen: ${overdue}

💰 Toplam Tutar: ${totalAmount.toLocaleString('tr-TR')} TL
✅ Ödenen Tutar: ${paidAmount.toLocaleString('tr-TR')} TL
⏳ Bekleyen Tutar: ${activeAmount.toLocaleString('tr-TR')} TL

📈 Ödeme Oranı: %${total > 0 ? Math.round((paid / total) * 100) : 0}`;

  telegramBot.sendMessage(chatId, message);
}

function sendTelegramNotification(title, message) {
  if (!telegramBot) return;

  try {
    const settingsPath = path.join(getAppDataPath(), 'hatirlatici-settings.json');
    if (!fs.existsSync(settingsPath)) return;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    
    if (settings.telegramBotEnabled && settings.telegramChatId) {
      const fullMessage = `🔔 ${title}\n\n${message}`;
      telegramBot.sendMessage(settings.telegramChatId, fullMessage);
    }
  } catch (error) {
    console.error('Telegram bildirimi gönderilemedi:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false,
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && tray) {
      event.preventDefault();
      mainWindow.hide();
      
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  // Telegram bot'u başlat
  setTimeout(initializeTelegramBot, 2000);
}

function createTray() {
  if (tray) return;

  try {
    const iconPath = path.join(__dirname, 'icon.ico');
    let icon;
    
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      if (process.platform === 'win32') {
        icon = icon.resize({ width: 16, height: 16 });
      }
    } else {
      icon = nativeImage.createEmpty();
    }

    tray = new Tray(icon);
    tray.setToolTip('Hatırlatıcınım - Çek ve Fatura Takip');

    updateTrayMenu();

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

  } catch (error) {
    console.error('Tray oluşturulamadı:', error);
  }
}

function updateTrayMenu() {
  if (!tray) return;

  try {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Uygulamayı Aç',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Güncellemeleri Kontrol Et',
        click: () => {
          autoUpdater.checkForUpdatesAndNotify();
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Tray menu güncellenemedi:', error);
  }
}

// Ana uygulama event'leri
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Auto updater setup
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (!tray) {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  
  if (backgroundNotificationInterval) {
    clearInterval(backgroundNotificationInterval);
  }
  
  if (tray) {
    tray.destroy();
    tray = null;
  }

  if (telegramBot) {
    telegramBot.stopPolling();
    telegramBot = null;
  }
});

// IPC Handlers
ipcMain.handle('show-notification', async (event, title, body) => {
  const { Notification } = require('electron');
  
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, 'icon.ico')
    });
    notification.show();
  }
  
  // Telegram bildirimi de gönder
  sendTelegramNotification(title, body);
});

ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// Güncelleme IPC handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    throw new Error(`Update check failed: ${error.message}`);
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    throw new Error(`Update download failed: ${error.message}`);
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// AppData dosya işlemleri
ipcMain.handle('save-app-data', async (event, key, data) => {
  try {
    const appDataPath = getAppDataPath();
    
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
    
    const filePath = path.join(appDataPath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    // Settings değiştiğinde Telegram bot'u yeniden başlat
    if (key === 'hatirlatici-settings') {
      setTimeout(initializeTelegramBot, 1000);
    }
    
    return true;
  } catch (error) {
    console.error('AppData save error:', error);
    return false;
  }
});

ipcMain.handle('load-app-data', async (event, key) => {
  try {
    const appDataPath = getAppDataPath();
    const filePath = path.join(appDataPath, `${key}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('AppData load error:', error);
    return null;
  }
});

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'checking');
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'update-available', info);
  }
});

autoUpdater.on('update-not-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'not-available');
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'download-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'update-downloaded');
  }
});