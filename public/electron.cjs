const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Telegram Bot - Optional import (hata durumunda uygulama çökmesin)
let TelegramBot = null;
try {
  TelegramBot = require('node-telegram-bot-api');
  console.log('✅ Telegram Bot API başarıyla yüklendi');
} catch (error) {
  console.warn('⚠️ Telegram Bot API yüklenemedi:', error.message);
  console.warn('📱 Telegram bot özellikleri devre dışı olacak');
}

let mainWindow;
let tray = null;
let telegramBot = null;
let isQuitting = false;
let backgroundNotificationInterval = null;

// Single Instance Lock - Sadece tek uygulama instance'ı çalışsın
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Eğer zaten bir instance çalışıyorsa, bu instance'ı kapat
  console.log('Uygulama zaten çalışıyor. Mevcut pencereyi öne getiriliyor...');
  app.quit();
} else {
  // İkinci instance açılmaya çalışıldığında bu event tetiklenir
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('İkinci instance tespit edildi. Ana pencereyi öne getiriliyor...');
    
    // Ana pencere varsa ve minimize edilmişse restore et
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      
      // Pencereyi öne getir ve odakla
      mainWindow.show();
      mainWindow.focus();
      
      // macOS'ta dock'tan göster
      if (process.platform === 'darwin') {
        app.show();
      }
    }
  });

  // Ana uygulama mantığı buradan devam eder
  console.log('Ana instance başlatılıyor...');
}

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
    console.log('🤖 Telegram bot başlatılıyor...');
    
    // Settings'den bot bilgilerini al
    const settings = getSettingsData();
    
    if (!settings.telegramBotEnabled || !settings.telegramBotToken) {
      console.log('⚠️ Telegram bot devre dışı veya token yok');
      return;
    }

    console.log('✅ Bot token bulundu, bot başlatılıyor...');
    
    // Bot'u oluştur
    telegramBot = new TelegramBot(settings.telegramBotToken, { 
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    console.log('🔧 Bot oluşturuldu, polling başlatılıyor...');
    
    // Bot başlatıldığında veri kontrolü yap
    telegramBot.on('polling_error', (error) => {
      console.error('❌ Telegram bot polling hatası:', error.message);
    });

    telegramBot.on('webhook_error', (error) => {
      console.error('❌ Telegram bot webhook hatası:', error.message);
    });

    // Bot başlatıldığında güncel veri kontrolü
    telegramBot.on('polling_start', () => {
      console.log('🚀 Telegram bot polling başladı');
      
      // Güncel veri kontrolü
      const checks = getChecksData();
      console.log(`📊 Bot başlatıldığında ${checks.length} ödeme bulundu`);
      
      // Veri kaynağını kontrol et
      const checksPath = path.join(getAppDataPath(), 'hatirlatici-checks.json');
      if (fs.existsSync(checksPath)) {
        const fileStats = fs.statSync(checksPath);
        console.log(`📅 Son veri güncelleme: ${fileStats.mtime.toLocaleString('tr-TR')}`);
      }
      
      // Bot komutlarını kur
      console.log('🔧 Bot komutları kuruluyor...');
      setupTelegramCommands();
      
      // Bot durumunu kontrol et
      console.log('🔍 Bot durumu kontrol ediliyor...');
      console.log('📱 Bot aktif:', telegramBot.isPolling());
      console.log('🆔 Bot token:', settings.telegramBotToken.substring(0, 10) + '...');
    });

    console.log('✅ Telegram bot başarıyla başlatıldı!');
    
    // Manuel olarak polling'i başlat
    try {
      console.log('🔄 Manuel polling başlatılıyor...');
      telegramBot.startPolling();
      console.log('✅ Manuel polling başlatıldı!');
    } catch (error) {
      console.error('❌ Manuel polling başlatılamadı:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Telegram bot başlatılamadı:', error);
  }
}

function setupTelegramCommands() {
  if (!telegramBot) {
    console.log('❌ Bot mevcut değil, komutlar kurulamadı');
    return;
  }

  console.log('📝 Telegram komutları kuruluyor...');

  // Tüm mevcut listener'ları temizle
  telegramBot.removeAllListeners('text');
  telegramBot.removeAllListeners('message');

  // /start komutu
  telegramBot.onText(/\/start/, (msg) => {
    console.log('🎯 /start komutu alındı:', msg.from.first_name);
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

    telegramBot.sendMessage(chatId, welcomeMessage)
      .then(() => console.log('✅ /start yanıtı gönderildi'))
      .catch(err => console.error('❌ /start yanıt hatası:', err.message));
  });

  // /bugun komutu
  telegramBot.onText(/\/bugun/, (msg) => {
    console.log('🎯 /bugun komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    sendTodayPayments(chatId);
  });

  // /yakin komutu
  telegramBot.onText(/\/yakin/, (msg) => {
    console.log('🎯 /yakin komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    sendUpcomingPayments(chatId);
  });

  // /tumu komutu
  telegramBot.onText(/\/tumu/, (msg) => {
    console.log('🎯 /tumu komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    sendAllPayments(chatId);
  });

  // /gecmis komutu
  telegramBot.onText(/\/gecmis/, (msg) => {
    console.log('🎯 /gecmis komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    sendOverduePayments(chatId);
  });

  // /istatistik komutu
  telegramBot.onText(/\/istatistik/, (msg) => {
    console.log('🎯 /istatistik komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    sendStatistics(chatId);
  });

  // Bilinmeyen komutlar için
  telegramBot.on('message', (msg) => {
    console.log('📨 Mesaj alındı:', {
      chatId: msg.chat.id,
      text: msg.text,
      from: msg.from?.first_name || 'Bilinmeyen'
    });
    
    if (msg.text && msg.text.startsWith('/') && 
        !['/start', '/bugun', '/yakin', '/tumu', '/gecmis', '/istatistik'].includes(msg.text)) {
      console.log('❓ Bilinmeyen komut:', msg.text);
      const chatId = msg.chat.id;
      telegramBot.sendMessage(chatId, 
        `❓ Bilinmeyen komut: ${msg.text}\n\n📋 Geçerli komutlar:\n/start /bugun /yakin /tumu /gecmis /istatistik`
      );
    }
  });

  // Error handler
  telegramBot.on('error', (error) => {
    console.error('❌ Telegram bot hatası:', error.message);
  });

  console.log('✅ Tüm komutlar başarıyla kuruldu!');
}

function getChecksData() {
  try {
    console.log('🔄 Telegram bot için güncel veri okunuyor...');
    
    // Önce AppData'dan okumaya çalış
    const checksPath = path.join(getAppDataPath(), 'hatirlatici-checks.json');
    console.log('📂 Checks dosyası aranıyor:', checksPath);
    
    let checks = [];
    
    if (fs.existsSync(checksPath)) {
      // AppData'dan oku
      const data = fs.readFileSync(checksPath, 'utf8');
      checks = JSON.parse(data);
      console.log('📊 AppData\'dan okunan check sayısı:', checks.length);
      
      // Dosya son güncelleme zamanını kontrol et
      const fileStats = fs.statSync(checksPath);
      const lastModified = fileStats.mtime;
      console.log('📅 AppData dosya son güncelleme:', lastModified.toLocaleString('tr-TR'));
    } else {
      console.log('⚠️ AppData\'da checks dosyası bulunamadı');
    }
    
    // Eğer AppData'dan veri yoksa veya boşsa, localStorage'dan okumaya çalış
    if (!checks || checks.length === 0) {
      console.log('🔄 localStorage\'dan veri okunmaya çalışılıyor...');
      
      // localStorage dosyasını bul
      const localStoragePath = path.join(getAppDataPath(), 'hatirlatici-localStorage.json');
      if (fs.existsSync(localStoragePath)) {
        try {
          const localStorageData = fs.readFileSync(localStoragePath, 'utf8');
          const localStorage = JSON.parse(localStorageData);
          
          if (localStorage.checks) {
            checks = localStorage.checks;
            console.log('📊 localStorage\'dan okunan check sayısı:', checks.length);
            
            // localStorage dosya zamanını da kontrol et
            const localStorageStats = fs.statSync(localStoragePath);
            const localStorageModified = localStorageStats.mtime;
            console.log('📅 localStorage dosya son güncelleme:', localStorageModified.toLocaleString('tr-TR'));
          }
        } catch (error) {
          console.error('❌ localStorage okunamadı:', error.message);
        }
      }
    }
    
    if (!checks || checks.length === 0) {
      console.log('⚠️ Hiç check verisi bulunamadı');
      return [];
    }
    
    // Veri doğrulama ve temizleme
    const validChecks = checks.filter(check => {
      return check && 
             check.id && 
             check.paymentDate && 
             typeof check.amount === 'number' &&
             check.createdBy &&
             check.signedTo;
    });
    
    console.log('✅ Geçerli check sayısı:', validChecks.length);
    
    // Tekrarlayan ödemeler için nextPaymentDate kontrolü
    validChecks.forEach(check => {
      if (check.isRecurring && check.nextPaymentDate) {
        console.log(`🔄 Tekrarlayan: ${check.signedTo} - Sonraki: ${check.nextPaymentDate} - Ödeme: ${check.paymentDate}`);
      } else {
        console.log(`📅 Normal: ${check.signedTo} - Ödeme: ${check.paymentDate}`);
      }
    });
    
    return validChecks;
  } catch (error) {
    console.error('❌ Checks verisi okunamadı:', error.message);
    return [];
  }
}

function getSettingsData() {
  try {
    // Önce AppData'dan okumaya çalış
    const settingsPath = path.join(getAppDataPath(), 'hatirlatici-settings.json');
    console.log('📂 Settings dosyası aranıyor:', settingsPath);
    
    let settings = null;
    
    if (fs.existsSync(settingsPath)) {
      // AppData'dan oku
      const data = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(data);
      console.log('✅ AppData\'dan settings yüklendi');
    } else {
      console.log('⚠️ AppData\'da settings dosyası bulunamadı');
    }
    
    // Eğer AppData'dan veri yoksa, localStorage'dan okumaya çalış
    if (!settings) {
      console.log('🔄 localStorage\'dan settings okunmaya çalışılıyor...');
      
      const localStoragePath = path.join(getAppDataPath(), 'hatirlatici-localStorage.json');
      if (fs.existsSync(localStoragePath)) {
        try {
          const localStorageData = fs.readFileSync(localStoragePath, 'utf8');
          const localStorage = JSON.parse(localStorageData);
          
          if (localStorage.settings) {
            settings = localStorage.settings;
            console.log('✅ localStorage\'dan settings yüklendi');
          }
        } catch (error) {
          console.error('❌ localStorage settings okunamadı:', error.message);
        }
      }
    }
    
    // Default değerler
    if (!settings) {
      console.log('⚠️ Settings bulunamadı, default değerler kullanılıyor');
      settings = {
        reminderDays: 3,
        notificationsEnabled: true,
        autoUpdateEnabled: true,
        dailyNotificationEnabled: true,
        dailyNotificationTime: '09:00',
        lastNotificationCheck: '',
        telegramBotEnabled: false,
        telegramBotToken: '',
        telegramChatId: '',
        theme: 'light'
      };
    }
    
    // Veri güncelliğini kontrol et
    if (fs.existsSync(settingsPath)) {
      const fileStats = fs.statSync(settingsPath);
      const lastModified = fileStats.mtime;
      console.log('📅 Settings son güncelleme:', lastModified.toLocaleString('tr-TR'));
    }
    
    console.log('📅 Reminder günleri:', settings.reminderDays);
    return settings;
  } catch (error) {
    console.error('❌ Settings verisi okunamadı:', error.message);
    return {
      reminderDays: 3,
      notificationsEnabled: true,
      autoUpdateEnabled: true,
      dailyNotificationEnabled: true,
      dailyNotificationTime: '09:00',
      lastNotificationCheck: '',
      telegramBotEnabled: false,
      telegramBotToken: '',
      telegramChatId: '',
      theme: 'light'
    };
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
  try {
    console.log('📅 Bugün ödenecekler sorgulanıyor...');
    const checks = getChecksData();
    const today = new Date().toDateString();
    
    console.log(`📊 Toplam ${checks.length} ödeme bulundu, bugün kontrol ediliyor...`);
    
    const todayChecks = checks.filter(check => {
      if (check.isPaid) return false;
      
      // Tekrarlayan ödemeler için nextPaymentDate kullan
      let checkDate;
      if (check.isRecurring && check.nextPaymentDate) {
        checkDate = new Date(check.nextPaymentDate).toDateString();
        console.log(`🔄 Tekrarlayan kontrol: ${check.signedTo} - Sonraki: ${check.nextPaymentDate} - Bugün: ${checkDate === today}`);
      } else {
        checkDate = new Date(check.paymentDate).toDateString();
        console.log(`📅 Normal kontrol: ${check.signedTo} - Ödeme: ${check.paymentDate} - Bugün: ${checkDate === today}`);
      }
      
      const isToday = checkDate === today;
      if (isToday) {
        console.log(`✅ Bugün: ${check.signedTo} - ${check.amount} TL`);
      }
      
      return isToday;
    });

    console.log('📊 Bugün ödenecek sayısı:', todayChecks.length);

    if (todayChecks.length === 0) {
      const message = '🎉 Bugün ödenecek çek/fatura yok!\n\n📅 Veriler güncel: ' + new Date().toLocaleString('tr-TR');
      telegramBot.sendMessage(chatId, message);
      return;
    }

    let message = `🔴 Bugün ${todayChecks.length} ödeme var:\n\n`;
    todayChecks.forEach((check, index) => {
      message += `${index + 1}. ${formatCheck(check)}\n\n`;
    });
    
    message += `📅 Veriler güncel: ${new Date().toLocaleString('tr-TR')}`;

    telegramBot.sendMessage(chatId, message);
  } catch (error) {
    console.error('❌ Bugün ödenecekler gönderilemedi:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri okunamadı. Lütfen daha sonra tekrar deneyin.');
  }
}

function sendUpcomingPayments(chatId) {
  try {
    console.log('⏰ Yakın ödemeler sorgulanıyor...');
    const checks = getChecksData();
    const settings = getSettingsData();
    const now = new Date();
    const reminderDays = settings.reminderDays || 3; // Settings'den al
    
    console.log(`📅 Reminder günleri: ${reminderDays}`);
    
    const upcomingChecks = checks.filter(check => {
      if (check.isPaid) return false;
      
      // Tekrarlayan ödemeler için nextPaymentDate kullan
      let checkDate;
      if (check.isRecurring && check.nextPaymentDate) {
        checkDate = new Date(check.nextPaymentDate);
      } else {
        checkDate = new Date(check.paymentDate);
      }
      
      const daysUntil = Math.ceil((checkDate - now) / (1000 * 60 * 60 * 24));
      const isInRange = daysUntil >= 0 && daysUntil <= reminderDays;
      
      if (isInRange) {
        console.log(`✅ ${check.signedTo}: ${daysUntil} gün kaldı`);
      }
      
      return isInRange;
    });

    // Tarihe göre sırala
    upcomingChecks.sort((a, b) => {
      const dateA = a.isRecurring && a.nextPaymentDate ? new Date(a.nextPaymentDate) : new Date(a.paymentDate);
      const dateB = b.isRecurring && b.nextPaymentDate ? new Date(b.nextPaymentDate) : new Date(b.paymentDate);
      return dateA - dateB;
    });

    console.log('📊 Yakın ödeme sayısı:', upcomingChecks.length);

    if (upcomingChecks.length === 0) {
      const message = `🎉 Önümüzdeki ${reminderDays} günde ödenecek çek/fatura yok!\n\n📅 Veriler güncel: ${new Date().toLocaleString('tr-TR')}`;
      telegramBot.sendMessage(chatId, message);
      return;
    }

    let message = `⏰ Önümüzdeki ${reminderDays} günde ${upcomingChecks.length} ödeme var:\n\n`;
    upcomingChecks.forEach((check, index) => {
      message += `${index + 1}. ${formatCheck(check)}\n\n`;
    });
    
    message += `📅 Veriler güncel: ${new Date().toLocaleString('tr-TR')}`;

    telegramBot.sendMessage(chatId, message);
  } catch (error) {
    console.error('❌ Yakın ödemeler gönderilemedi:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri okunamadı. Lütfen daha sonra tekrar deneyin.');
  }
}

function sendAllPayments(chatId) {
  try {
    console.log('📋 Tüm ödemeler sorgulanıyor...');
    const checks = getChecksData();
    
    if (checks.length === 0) {
      const message = '📭 Henüz hiç ödeme eklenmemiş.\n\n📅 Veriler güncel: ' + new Date().toLocaleString('tr-TR');
      telegramBot.sendMessage(chatId, message);
      return;
    }

    // Sadece ödenmemiş olanları göster
    const unpaidChecks = checks.filter(check => !check.isPaid);
    
    console.log(`📊 Toplam: ${checks.length}, Ödenmemiş: ${unpaidChecks.length}`);
    
    if (unpaidChecks.length === 0) {
      const message = '🎉 Tüm ödemeler tamamlandı!\n\n📅 Veriler güncel: ' + new Date().toLocaleString('tr-TR');
      telegramBot.sendMessage(chatId, message);
      return;
    }

    // Tarihe göre sırala
    unpaidChecks.sort((a, b) => {
      const dateA = a.isRecurring && a.nextPaymentDate ? new Date(a.nextPaymentDate) : new Date(a.paymentDate);
      const dateB = b.isRecurring && b.nextPaymentDate ? new Date(b.nextPaymentDate) : new Date(b.paymentDate);
      return dateA - dateB;
    });

    let message = `📋 Toplam ${unpaidChecks.length} bekleyen ödeme var:\n\n`;
    
    // İlk 10 tanesini göster
    const checksToShow = unpaidChecks.slice(0, 10);
    checksToShow.forEach((check, index) => {
      message += `${index + 1}. ${formatCheck(check)}\n\n`;
    });

    if (unpaidChecks.length > 10) {
      message += `... ve ${unpaidChecks.length - 10} ödeme daha\n\n`;
    }
    
    message += `📅 Veriler güncel: ${new Date().toLocaleString('tr-TR')}`;

    telegramBot.sendMessage(chatId, message);
  } catch (error) {
    console.error('❌ Tüm ödemeler gönderilemedi:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri okunamadı. Lütfen daha sonra tekrar deneyin.');
  }
}

function sendOverduePayments(chatId) {
  try {
    console.log('⚠️ Gecikmiş ödemeler sorgulanıyor...');
    const checks = getChecksData();
    const now = new Date();
    
    const overdueChecks = checks.filter(check => {
      if (check.isPaid) return false;
      
      // Tekrarlayan ödemeler için nextPaymentDate kullan
      let checkDate;
      if (check.isRecurring && check.nextPaymentDate) {
        checkDate = new Date(check.nextPaymentDate);
      } else {
        checkDate = new Date(check.paymentDate);
      }
      
      const isOverdue = checkDate < now;
      if (isOverdue) {
        const daysOverdue = Math.ceil((now - checkDate) / (1000 * 60 * 60 * 24));
        console.log(`⚠️ Gecikmiş: ${check.signedTo} - ${daysOverdue} gün`);
      }
      
      return isOverdue;
    });

    // Gecikme gününe göre sırala (en çok geciken önce)
    overdueChecks.sort((a, b) => {
      const dateA = a.isRecurring && a.nextPaymentDate ? new Date(a.nextPaymentDate) : new Date(a.paymentDate);
      const dateB = b.isRecurring && b.nextPaymentDate ? new Date(b.nextPaymentDate) : new Date(b.paymentDate);
      return dateA - dateB;
    });

    console.log('📊 Gecikmiş ödeme sayısı:', overdueChecks.length);

    if (overdueChecks.length === 0) {
      const message = '🎉 Gecikmiş ödeme yok!\n\n📅 Veriler güncel: ' + new Date().toLocaleString('tr-TR');
      telegramBot.sendMessage(chatId, message);
      return;
    }

    let message = `⚠️ ${overdueChecks.length} gecikmiş ödeme var:\n\n`;
    overdueChecks.forEach((check, index) => {
      message += `${index + 1}. ${formatCheck(check)}\n\n`;
    });
    
    message += `📅 Veriler güncel: ${new Date().toLocaleString('tr-TR')}`;

    telegramBot.sendMessage(chatId, message);
  } catch (error) {
    console.error('❌ Gecikmiş ödemeler gönderilemedi:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri okunamadı. Lütfen daha sonra tekrar deneyin.');
  }
}

function sendStatistics(chatId) {
  try {
    console.log('📊 İstatistikler sorgulanıyor...');
    const checks = getChecksData();
    
    if (checks.length === 0) {
      const message = '📭 Henüz hiç ödeme eklenmemiş.\n\n📅 Veriler güncel: ' + new Date().toLocaleString('tr-TR');
      telegramBot.sendMessage(chatId, message);
      return;
    }

    const totalChecks = checks.length;
    const paidChecks = checks.filter(c => c.isPaid);
    const unpaidChecks = checks.filter(c => !c.isPaid);
    const recurringChecks = checks.filter(c => c.isRecurring);
    
    const totalAmount = checks.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = paidChecks.reduce((sum, c) => sum + c.amount, 0);
    const unpaidAmount = unpaidChecks.reduce((sum, c) => sum + c.amount, 0);
    
    const now = new Date();
    const overdueChecks = unpaidChecks.filter(check => {
      const checkDate = check.isRecurring && check.nextPaymentDate 
        ? new Date(check.nextPaymentDate)
        : new Date(check.paymentDate);
      return checkDate < now;
    });
    
    const overdueAmount = overdueChecks.reduce((sum, c) => sum + c.amount, 0);

    const message = `📊 Ödeme İstatistikleri:

📋 Toplam: ${totalChecks} ödeme
💰 Toplam Tutar: ${totalAmount.toLocaleString('tr-TR')} ₺

✅ Ödenen: ${paidChecks.length} ödeme
💰 Ödenen Tutar: ${paidAmount.toLocaleString('tr-TR')} ₺

⏳ Bekleyen: ${unpaidChecks.length} ödeme
💰 Bekleyen Tutar: ${unpaidAmount.toLocaleString('tr-TR')} ₺

⚠️ Gecikmiş: ${overdueChecks.length} ödeme
💰 Gecikmiş Tutar: ${overdueAmount.toLocaleString('tr-TR')} ₺

🔄 Tekrarlayan: ${recurringChecks.length} ödeme

📈 Ödeme Oranı: %${Math.round((paidChecks.length / totalChecks) * 100)}`;

    telegramBot.sendMessage(chatId, message);
  } catch (error) {
    console.error('❌ İstatistikler gönderilemedi:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri okunamadı. Lütfen daha sonra tekrar deneyin.');
  }
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
  // Eğer ana pencere zaten varsa, onu öne getir
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

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
    // Pencere davranış iyileştirmeleri
    titleBarStyle: 'default',
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
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
    mainWindow.focus(); // Pencereyi odakla
    
    // Windows'ta taskbar'da yanıp söndür
    if (process.platform === 'win32') {
      mainWindow.flashFrame(false);
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && tray) {
      event.preventDefault();
      mainWindow.hide();
      
      // İlk sefer gizlendiğinde kullanıcıya bilgi ver
      if (!mainWindow.isVisible()) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'Hatırlatıcınım',
          content: 'Uygulama arka planda çalışmaya devam ediyor. Tamamen kapatmak için sağ tık → Çıkış.'
        });
      }
      
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  // Pencere odaklandığında
  mainWindow.on('focus', () => {
    console.log('Ana pencere odaklandı');
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
          // Eğer görünürse gizle
          mainWindow.hide();
        } else {
          // Eğer gizliyse göster ve odakla
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
          
          // Windows'ta taskbar'a getir
          if (process.platform === 'win32') {
            mainWindow.setSkipTaskbar(false);
          }
        }
      } else {
        createWindow();
      }
    });

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
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

function updateTrayMenu() {
  if (!tray) return;

  try {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Uygulamayı Aç',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
            
            // Windows'ta taskbar'a getir
            if (process.platform === 'win32') {
              mainWindow.setSkipTaskbar(false);
            }
          } else {
            createWindow();
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
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
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
    console.log('🔍 IPC: check-for-updates başlatıldı');
    await autoUpdater.checkForUpdates();
    console.log('✅ IPC: check-for-updates çağrıldı, event\'ler dinleniyor...');
    return { success: true, message: 'Update check started' };
  } catch (error) {
    console.error('❌ IPC: check-for-updates hatası:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    console.log('📥 IPC: download-update başlatıldı');
    await autoUpdater.downloadUpdate();
    return { success: true, message: 'Download started' };
  } catch (error) {
    console.error('❌ IPC: download-update hatası:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('install-update', () => {
  try {
    console.log('🔄 IPC: install-update başlatıldı');
    autoUpdater.quitAndInstall();
    return { success: true, message: 'Installing update...' };
  } catch (error) {
    console.error('❌ IPC: install-update hatası:', error);
    return { success: false, message: error.message };
  }
});

// AutoUpdater Event Listeners
autoUpdater.on('checking-for-update', () => {
  console.log('🔍 AutoUpdater: Güncellemeler kontrol ediliyor...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'checking-for-update');
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('📥 AutoUpdater: Güncelleme mevcut:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('✅ AutoUpdater: Güncelleme yok, programınız güncel');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'update-not-available', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('❌ AutoUpdater hatası:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'error', { message: err.message });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  console.log(`📥 AutoUpdater: İndiriliyor... %${percent}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'download-progress', { percent });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ AutoUpdater: Güncelleme indirildi, yeniden başlatmaya hazır');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'update-downloaded', info);
  }
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