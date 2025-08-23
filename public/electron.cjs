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
    console.log('🤖 YENİ Telegram bot sistemi başlatılıyor...');
    
    // Settings'den bot bilgilerini al
    const settings = getSettingsData();
    
    if (!settings.telegramBotEnabled || !settings.telegramBotToken) {
      console.log('⚠️ Telegram bot devre dışı veya token yok');
      return;
    }

    console.log('✅ Bot token bulundu, yeni sistem kuruluyor...');
    
    // Eski bot'u temizle
    if (telegramBot) {
      try {
        telegramBot.stopPolling();
        telegramBot = null;
        console.log('🧹 Eski bot temizlendi');
      } catch (error) {
        console.log('⚠️ Eski bot temizlenirken hata:', error.message);
      }
    }
    
    // Yeni bot'u oluştur
    telegramBot = new TelegramBot(settings.telegramBotToken, { 
      polling: true,
      interval: 1000,
      autoStart: true
    });
    
    console.log('🔧 Yeni bot oluşturuldu, komutlar kuruluyor...');
    
    // Yeni komut sistemini kur
    setupNewTelegramCommands();
    
    // Bot durumunu kontrol et
    console.log('🔍 Yeni bot durumu kontrol ediliyor...');
    console.log('📱 Bot polling:', telegramBot.isPolling());
    console.log('🆔 Bot token:', settings.telegramBotToken.substring(0, 10) + '...');
    
    // Test mesajı gönder
    if (settings.telegramChatId) {
      setTimeout(() => {
        sendTestMessage(settings.telegramChatId);
      }, 2000);
    }
    
    console.log('✅ YENİ Telegram bot sistemi başarıyla başlatıldı!');
    
  } catch (error) {
    console.error('❌ Yeni Telegram bot başlatılamadı:', error);
  }
}

function setupNewTelegramCommands() {
  if (!telegramBot) {
    console.log('❌ Bot mevcut değil, komutlar kurulamadı');
    return;
  }

  console.log('📝 YENİ Telegram komut sistemi kuruluyor...');

  // Tüm mevcut listener'ları temizle
  telegramBot.removeAllListeners('text');
  telegramBot.removeAllListeners('message');
  
  console.log('🧹 Eski listener\'lar temizlendi');

  // /start komutu
  telegramBot.onText(/\/start/, (msg) => {
    console.log('🎯 /start komutu alındı:', msg.from.first_name);
    console.log('📱 Chat ID:', msg.chat.id);
    console.log('👤 Kullanıcı:', msg.from.first_name);
    
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    console.log('🔄 /start komutu için veri yeniden okunuyor...');
    
    getChecksData().then(checks => {
      console.log(`✅ /start komutu için ${checks.length} check alındı`);
      
      const welcomeMessage = `🤖 Hatırlatıcınım Bot'a hoş geldiniz!

📋 Kullanılabilir komutlar:
/bugun - Bugün ödenecek çek/faturalar
/yakin - 7 gün içinde ödenecekler
/tumu - Tüm aktif ödemeler
/gecmis - Vadesi geçen ödemeler
/istatistik - Genel özet

💫 Chat ID'niz: ${chatId}
🔄 Bot veri kaynağı: ${checks.length} ödeme bulundu
Bu ID'yi uygulamanın ayarlarına girin.`;

      console.log('📤 /start mesajı gönderiliyor...');
      telegramBot.sendMessage(chatId, welcomeMessage)
        .then(() => {
          console.log('✅ /start yanıtı gönderildi');
          console.log('📨 Mesaj uzunluğu:', welcomeMessage.length);
        })
        .catch(err => {
          console.error('❌ /start yanıt hatası:', err.message);
          console.error('🔍 Hata detayı:', err);
        });
    }).catch(error => {
      console.error('❌ /start veri hatası:', error.message);
      const errorMessage = `🤖 Hatırlatıcınım Bot'a hoş geldiniz!

❌ Veri yüklenirken hata oluştu.
Lütfen daha sonra tekrar deneyin.

💫 Chat ID'niz: ${chatId}`;
      
      telegramBot.sendMessage(chatId, errorMessage);
    });
  });

  // /bugun komutu
  telegramBot.onText(/\/bugun/, (msg) => {
    console.log('🎯 /bugun komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi yeniden oku
    console.log('🔄 /bugun komutu için veri yeniden okunuyor...');
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
      from: msg.from?.first_name || 'Bilinmeyen',
      type: msg.text ? 'text' : 'other'
    });
    
    if (msg.text && msg.text.startsWith('/')) {
      console.log('🔍 Komut tespit edildi:', msg.text);
      
      if (!['/start', '/bugun', '/yakin', '/tumu', '/gecmis', '/istatistik'].includes(msg.text)) {
        console.log('❓ Bilinmeyen komut:', msg.text);
        const chatId = msg.chat.id;
        telegramBot.sendMessage(chatId, 
          `❓ Bilinmeyen komut: ${msg.text}\n\n📋 Geçerli komutlar:\n/start /bugun /yakin /tumu /gecmis /istatistik`
        );
      } else {
        console.log('✅ Bilinen komut:', msg.text);
      }
    }
  });

  // Error handler
  telegramBot.on('error', (error) => {
    console.error('❌ Telegram bot hatası:', error.message);
  });

  console.log('✅ YENİ komut sistemi başarıyla kuruldu!');
}

// Yeni test mesaj fonksiyonu
function sendTestMessage(chatId) {
  getChecksData().then(checks => {
    try {
      console.log('🧪 Yeni test mesajı gönderiliyor...');
      
      const now = new Date();
      const today = now.toDateString();
      
      // Bugün ödenecek ödemeleri hesapla
      const todayChecks = checks.filter(check => {
        if (check.isPaid) return false;
        
        let checkDate;
        if (check.isRecurring && check.nextPaymentDate) {
          checkDate = new Date(check.nextPaymentDate).toDateString();
          console.log(`🔄 Test - Tekrarlayan: ${check.signedTo} - Sonraki: ${check.nextPaymentDate}`);
        } else {
          checkDate = new Date(check.paymentDate).toDateString();
          console.log(`📅 Test - Normal: ${check.signedTo} - Ödeme: ${check.paymentDate}`);
        }
        
        return checkDate === today;
      });
      
      // Gecikmiş ödemeleri hesapla
      const overdueChecks = checks.filter(check => {
        if (check.isPaid) return false;
        
        let checkDate;
        if (check.isRecurring && check.nextPaymentDate) {
          checkDate = new Date(check.nextPaymentDate);
        } else {
          checkDate = new Date(check.paymentDate);
        }
        
        return checkDate < now;
      });
      
      let testMessage = '🤖 YENİ Bot sistemi başlatıldı!\n\n';
      testMessage += `📊 Güncel veri: ${checks.length} ödeme bulundu\n`;
      testMessage += `🔴 Bugün ödenecek: ${todayChecks.length} ödeme\n`;
      testMessage += `⚠️ Gecikmiş: ${overdueChecks.length} ödeme\n\n`;
      testMessage += '📋 Kullanılabilir komutlar:\n';
      testMessage += '• /start - Yardım menüsü\n';
      testMessage += '• /bugun - Bugün ödenecekler\n';
      testMessage += '• /yakin - Yakın ödemeler\n';
      testMessage += '• /tumu - Tüm ödemeler\n';
      testMessage += '• /gecmis - Gecikmiş ödemeler\n';
      testMessage += '• /istatistik - İstatistikler\n\n';
      testMessage += '🔄 Yeni sistem: Güncel veri garantisi!\n';
      testMessage += `📅 Veri kaynağı: ${checks.length} ödeme bulundu\n`;
      testMessage += `⏰ Bot başlatma: ${new Date().toLocaleString('tr-TR')}`;
      
      telegramBot.sendMessage(chatId, testMessage).then(() => {
        console.log('✅ Yeni test mesajı gönderildi');
        console.log('📊 Test mesajında gösterilen veri:', {
          totalChecks: checks.length,
          todayChecks: todayChecks.length,
          overdueChecks: overdueChecks.length
        });
      }).catch(err => {
        console.error('❌ Yeni test mesajı gönderilemedi:', err.message);
      });
      
    } catch (error) {
      console.error('❌ Test mesajı hatası:', error.message);
    }
  }).catch(error => {
    console.error('❌ Test mesajı veri hatası:', error.message);
  });
}

async function getChecksData() {
  try {
    console.log('🔄 Telegram bot için GÜNCEL veri alınıyor...');
    
    // YENİ YAKLAŞIM: Renderer process'ten güncel veriyi al
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('📱 Renderer process\'ten veri çekiliyor...');
      
      try {
        const rendererData = await mainWindow.webContents.executeJavaScript(`
          (() => {
            try {
              const checksData = localStorage.getItem('hatirlatici-checks');
              if (checksData) {
                const checks = JSON.parse(checksData);
                console.log('📊 Renderer: ' + checks.length + ' check bulundu');
                return checks;
              }
              return [];
            } catch (error) {
              console.error('❌ Renderer veri hatası:', error);
              return [];
            }
          })()
        `);
        
        if (rendererData && rendererData.length > 0) {
          console.log(`✅ Renderer'dan ${rendererData.length} check alındı`);
          return rendererData.filter(check => {
            return check && 
                   check.id && 
                   check.paymentDate && 
                   typeof check.amount === 'number' &&
                   check.createdBy &&
                   check.signedTo;
          });
        }
      } catch (rendererError) {
        console.warn('⚠️ Renderer\'dan veri alınamadı:', rendererError.message);
      }
    }
    
    // Fallback: Dosya sisteminden oku
    console.log('📂 Fallback: Dosya sisteminden veri okunuyor...');
    return getChecksDataFromFiles();
    
  } catch (error) {
    console.error('❌ getChecksData kritik hata:', error.message);
    return [];
  }
}

// Dosya sisteminden veri okuma fonksiyonu
function getChecksDataFromFiles() {
  try {
    console.log('📂 Dosya sisteminden veri okunuyor...');
    
    const appDataPath = getAppDataPath();
    console.log('📂 AppData klasörü:', appDataPath);
    
    let checks = [];
    let dataSource = 'unknown';
    
    // Önce checks dosyasını kontrol et
    const checksFilePath = path.join(appDataPath, 'hatirlatici-checks.json');
    if (fs.existsSync(checksFilePath)) {
      try {
        const data = fs.readFileSync(checksFilePath, 'utf8');
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData)) {
          checks = parsedData;
          dataSource = 'Checks File';
          console.log(`✅ Checks dosyasından ${checks.length} check yüklendi`);
        }
      } catch (error) {
        console.error('❌ Checks dosyası okunamadı:', error.message);
      }
    }
    
    // Eğer checks bulunamazsa localStorage dosyasını dene
    if (checks.length === 0) {
      const localStorageFilePath = path.join(appDataPath, 'hatirlatici-localStorage.json');
      if (fs.existsSync(localStorageFilePath)) {
        try {
          const data = fs.readFileSync(localStorageFilePath, 'utf8');
          const parsedData = JSON.parse(data);
          if (parsedData.checks && Array.isArray(parsedData.checks)) {
            checks = parsedData.checks;
            dataSource = 'localStorage File';
            console.log(`✅ localStorage dosyasından ${checks.length} check yüklendi`);
          }
        } catch (error) {
          console.error('❌ localStorage dosyası okunamadı:', error.message);
        }
      }
    }
    
    // Veri doğrulama
    if (!checks || checks.length === 0) {
      console.log('❌ Hiç check verisi bulunamadı!');
      return [];
    }
    
    // Veri temizleme ve doğrulama
    const validChecks = checks.filter(check => {
      const isValid = check && 
                     check.id && 
                     check.paymentDate && 
                     typeof check.amount === 'number' &&
                     check.createdBy &&
                     check.signedTo;
      
      if (!isValid) {
        console.log(`⚠️ Geçersiz check filtrelendi:`, {
          id: check?.id || 'Yok',
          signedTo: check?.signedTo || 'Yok',
          amount: check?.amount || 'Yok'
        });
      }
      
      return isValid;
    });
    
    console.log(`✅ Veri yükleme tamamlandı:`);
    console.log(`📊 Toplam check: ${checks.length}`);
    console.log(`📊 Geçerli check: ${validChecks.length}`);
    console.log(`📊 Kaynak: ${dataSource}`);
    
    return validChecks;
  } catch (error) {
    console.error('❌ getChecksDataFromFiles hatası:', error.message);
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
  
  // Tekrarlayan ödemeler için nextPaymentDate kullan, normal ödemeler için paymentDate
  let displayDate, daysLeft;
  if (check.isRecurring && check.nextPaymentDate) {
    displayDate = new Date(check.nextPaymentDate).toLocaleDateString('tr-TR');
    daysLeft = Math.ceil((new Date(check.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24));
    console.log(`🔄 formatCheck - Tekrarlayan: ${check.signedTo} - Sonraki: ${check.nextPaymentDate} - Gün: ${daysLeft}`);
  } else {
    displayDate = new Date(check.paymentDate).toLocaleDateString('tr-TR');
    daysLeft = Math.ceil((new Date(check.paymentDate) - new Date()) / (1000 * 60 * 60 * 24));
    console.log(`📅 formatCheck - Normal: ${check.signedTo} - Ödeme: ${check.paymentDate} - Gün: ${daysLeft}`);
  }
  
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
📅 ${displayDate}
${status}`;
}

function sendTodayPayments(chatId) {
  getChecksData().then(checks => {
    try {
      console.log('📅 Bugün ödenecekler sorgulanıyor...');
      const today = new Date().toDateString();
      
      console.log(`📊 Toplam ${checks.length} ödeme bulundu, bugün kontrol ediliyor...`);
      
      const todayChecks = checks.filter(check => {
        if (check.isPaid) return false;
        
        // Tekrarlayan ödemeler için nextPaymentDate kullan
        let checkDate, checkDateString;
        if (check.isRecurring && check.nextPaymentDate) {
          checkDate = new Date(check.nextPaymentDate);
          checkDateString = checkDate.toDateString();
          console.log(`🔄 Tekrarlayan kontrol: ${check.signedTo} - Sonraki: ${check.nextPaymentDate} - Bugün: ${checkDateString === today}`);
        } else {
          checkDate = new Date(check.paymentDate);
          checkDateString = checkDate.toDateString();
          console.log(`📅 Normal kontrol: ${check.signedTo} - Ödeme: ${check.paymentDate} - Bugün: ${checkDateString === today}`);
        }
        
        const isToday = checkDateString === today;
        if (isToday) {
          console.log(`✅ Bugün: ${check.signedTo} - ${check.amount} TL - Tarih: ${checkDateString}`);
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
  }).catch(error => {
    console.error('❌ Bugün ödenecekler veri hatası:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri alınamadı. Lütfen daha sonra tekrar deneyin.');
  });
}

function sendUpcomingPayments(chatId) {
  getChecksData().then(checks => {
    try {
      console.log('⏰ Yakın ödemeler sorgulanıyor...');
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
  }).catch(error => {
    console.error('❌ Yakın ödemeler veri hatası:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri alınamadı. Lütfen daha sonra tekrar deneyin.');
  });
}

function sendAllPayments(chatId) {
  getChecksData().then(checks => {
    try {
      console.log('📋 Tüm ödemeler sorgulanıyor...');
      console.log(`🔄 Güncel veri alındı: ${checks.length} ödeme`);
      
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

      // Veri doğrulama
      const validUnpaidChecks = unpaidChecks.filter(check => {
        const isValid = check && 
                       check.id && 
                       check.paymentDate && 
                       typeof check.amount === 'number' &&
                       check.createdBy &&
                       check.signedTo;
        
        if (!isValid) {
          console.log(`⚠️ Geçersiz check filtrelendi: ${check?.signedTo || 'Bilinmiyor'}`);
        }
        
        return isValid;
      });
      
      console.log(`✅ Geçerli ödenmemiş check sayısı: ${validUnpaidChecks.length}`);

      // Tarihe göre sırala
      validUnpaidChecks.sort((a, b) => {
        const dateA = a.isRecurring && a.nextPaymentDate ? new Date(a.nextPaymentDate) : new Date(a.paymentDate);
        const dateB = b.isRecurring && b.nextPaymentDate ? new Date(b.nextPaymentDate) : new Date(b.paymentDate);
        return dateA - dateB;
      });

      let message = `📋 Toplam ${validUnpaidChecks.length} bekleyen ödeme var:\n\n`;
      
      // İlk 10 tanesini göster
      const checksToShow = validUnpaidChecks.slice(0, 10);
      checksToShow.forEach((check, index) => {
        message += `${index + 1}. ${formatCheck(check)}\n\n`;
      });

      if (validUnpaidChecks.length > 10) {
        message += `... ve ${validUnpaidChecks.length - 10} ödeme daha\n\n`;
      }
      
      message += `📅 Veriler güncel: ${new Date().toLocaleString('tr-TR')}`;
      message += `\n🔄 Bot veri kaynağı: ${checks.length} ödeme bulundu`;

      telegramBot.sendMessage(chatId, message);
    } catch (error) {
      console.error('❌ Tüm ödemeler gönderilemedi:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri okunamadı. Lütfen daha sonra tekrar deneyin.');
    }
  }).catch(error => {
    console.error('❌ Tüm ödemeler veri hatası:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri alınamadı. Lütfen daha sonra tekrar deneyin.');
  });
}

function sendOverduePayments(chatId) {
  getChecksData().then(checks => {
    try {
      console.log('⚠️ Gecikmiş ödemeler sorgulanıyor...');
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
  }).catch(error => {
    console.error('❌ Gecikmiş ödemeler veri hatası:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri alınamadı. Lütfen daha sonra tekrar deneyin.');
  });
}

function sendStatistics(chatId) {
  getChecksData().then(checks => {
    try {
      console.log('📊 İstatistikler sorgulanıyor...');
      
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
  }).catch(error => {
    console.error('❌ İstatistikler veri hatası:', error.message);
    telegramBot.sendMessage(chatId, '❌ Veri alınamadı. Lütfen daha sonra tekrar deneyin.');
  });
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

// Telegram bot için güncel veri al
ipcMain.handle('get-telegram-data', async (event) => {
  try {
    console.log('🔄 IPC: Telegram bot için güncel veri isteniyor...');
    
    // Renderer process'ten güncel veriyi al
    const checks = await event.sender.executeJavaScript(`
      (() => {
        try {
          const checksData = localStorage.getItem('hatirlatici-checks');
          if (checksData) {
            return JSON.parse(checksData);
          }
          return [];
        } catch (error) {
          console.error('Telegram data error:', error);
          return [];
        }
      })()
    `);
    
    console.log(`✅ IPC: Renderer'dan ${checks.length} check alındı`);
    
    // Veri doğrulama
    const validChecks = checks.filter(check => {
      return check && 
             check.id && 
             check.paymentDate && 
             typeof check.amount === 'number' &&
             check.createdBy &&
             check.signedTo;
    });
    
    console.log(`✅ IPC: ${validChecks.length} geçerli check bulundu`);
    
    return {
      success: true,
      checks: validChecks,
      timestamp: new Date().toISOString(),
      source: 'Renderer Process'
    };
  } catch (error) {
    console.error('❌ IPC: Telegram data hatası:', error.message);
    return {
      success: false,
      error: error.message,
      checks: [],
      timestamp: new Date().toISOString(),
      source: 'Error'
    };
  }
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
    console.log(`💾 AppData kaydetme: ${key}`);
    const appDataPath = getAppDataPath();
    
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
      console.log('📁 AppData klasörü oluşturuldu:', appDataPath);
    }
    
    // Dosya adlarını düzelt
    let fileName = key;
    if (key === 'checks') fileName = 'hatirlatici-checks';
    if (key === 'settings') fileName = 'hatirlatici-settings';
    
    const filePath = path.join(appDataPath, `${fileName}.json`);
    console.log('📄 Dosya yolu:', filePath);
    
    // Veriyi kaydet
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ ${key} verisi kaydedildi:`, filePath);
    
    // Dosya boyutunu kontrol et
    const fileStats = fs.statSync(filePath);
    console.log(`📊 Dosya boyutu: ${fileStats.size} bytes`);
    console.log(`📅 Son güncelleme: ${fileStats.mtime.toLocaleString('tr-TR')}`);
    
    // Settings değiştiğinde Telegram bot'u yeniden başlat
    if (key === 'settings') {
      console.log('🔄 Settings değişti, Telegram bot yeniden başlatılıyor...');
      setTimeout(initializeTelegramBot, 1000);
    }
    
    return true;
  } catch (error) {
    console.error('❌ AppData save error:', error);
    return false;
  }
});

ipcMain.handle('load-app-data', async (event, key) => {
  try {
    console.log(`📂 AppData yükleme: ${key}`);
    const appDataPath = getAppDataPath();
    
    // Dosya adlarını düzelt
    let fileName = key;
    if (key === 'checks') fileName = 'hatirlatici-checks';
    if (key === 'settings') fileName = 'hatirlatici-settings';
    
    const filePath = path.join(appDataPath, `${fileName}.json`);
    console.log('📄 Dosya yolu:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ Dosya bulunamadı:', filePath);
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Dosya bilgilerini logla
    const fileStats = fs.statSync(filePath);
    console.log(`✅ ${key} verisi yüklendi:`, filePath);
    console.log(`📊 Dosya boyutu: ${fileStats.size} bytes`);
    console.log(`📅 Son güncelleme: ${fileStats.mtime.toLocaleString('tr-TR')}`);
    
    return parsedData;
  } catch (error) {
    console.error('❌ AppData load error:', error);
    return null;
  }
});