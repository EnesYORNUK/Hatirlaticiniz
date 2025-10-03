const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, Notification } = require('electron');
require('dotenv').config();
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

// Expose Supabase config to the renderer process
ipcMain.handle('get-supabase-config', () => {
  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  };
});

let mainWindow;
let tray = null;
let telegramBot = null;
let isQuitting = false;
let backgroundNotificationInterval = null;

// Single Instance Lock - Etkin
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Eğer zaten bir instance çalışıyorsa, yeni süreci kapat
  console.log('Uygulama zaten çalışıyor. Mevcut pencereyi öne getiriliyor...');
  app.quit();
  process.exit(0);
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

📋 Ödeme Komutları:
/bugun - Bugün ödenecek çek/faturalar
/yakin - 7 gün içinde ödenecekler
/tumu - Tüm aktif ödemeler
/gecmis - Vadesi geçen ödemeler
/istatistik - Genel özet

💊 İlaç Komutları:
/ilaclarim - Bugün alınacak ilaçlar
/ilac_program - Haftalık ilaç programı
/ilac_gecmis - İlaç geçmişi
/ilac_istatistik - İlaç uyum istatistikleri

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
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getChecksData().then(checks => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate.getTime() === today.getTime() && !check.isPaid;
      });
      
      if (todayChecks.length === 0) {
        telegramBot.sendMessage(chatId, '✅ Bugün ödenecek çek/fatura bulunmuyor.');
        return;
      }
      
      let message = `📅 *BUGÜN ÖDENECEK ÇEK/FATURALAR*\n\n`;
      
      todayChecks.forEach((check, index) => {
        message += `${index + 1}. ${check.name} - ${formatCurrency(check.amount)}\n`;
        if (check.notes) message += `   _${check.notes}_\n`;
        message += '\n';
      });
      
      message += `\n💰 *TOPLAM:* ${formatCurrency(todayChecks.reduce((sum, check) => sum + check.amount, 0))}`;
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /bugun veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  // /yakin komutu
  telegramBot.onText(/\/yakin/, (msg) => {
    console.log('🎯 /yakin komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getChecksData().then(checks => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const upcomingChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate >= today && checkDate <= nextWeek && !check.isPaid;
      });
      
      if (upcomingChecks.length === 0) {
        telegramBot.sendMessage(chatId, '✅ Yaklaşan 7 gün içinde ödenecek çek/fatura bulunmuyor.');
        return;
      }
      
      // Tarihe göre grupla
      const groupedChecks = {};
      upcomingChecks.forEach(check => {
        const dateStr = new Date(check.date).toLocaleDateString('tr-TR');
        if (!groupedChecks[dateStr]) {
          groupedChecks[dateStr] = [];
        }
        groupedChecks[dateStr].push(check);
      });
      
      let message = `📅 *YAKLAŞAN 7 GÜN İÇİNDEKİ ÖDEMELER*\n\n`;
      
      Object.keys(groupedChecks).forEach(dateStr => {
        message += `📆 *${dateStr}*\n`;
        
        groupedChecks[dateStr].forEach((check, index) => {
          message += `${index + 1}. ${check.name} - ${formatCurrency(check.amount)}\n`;
          if (check.notes) message += `   _${check.notes}_\n`;
        });
        
        message += `\n`;
      });
      
      message += `\n💰 *TOPLAM:* ${formatCurrency(upcomingChecks.reduce((sum, check) => sum + check.amount, 0))}`;
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /yakin veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  // /tumu komutu
  telegramBot.onText(/\/tumu/, (msg) => {
    console.log('🎯 /tumu komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getChecksData().then(checks => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate >= today && !check.isPaid;
      });
      
      if (activeChecks.length === 0) {
        telegramBot.sendMessage(chatId, '✅ Aktif çek/fatura bulunmuyor.');
        return;
      }
      
      // Tarihe göre sırala
      activeChecks.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Tarihe göre grupla
      const groupedChecks = {};
      activeChecks.forEach(check => {
        const dateStr = new Date(check.date).toLocaleDateString('tr-TR');
        if (!groupedChecks[dateStr]) {
          groupedChecks[dateStr] = [];
        }
        groupedChecks[dateStr].push(check);
      });
      
      let message = `📋 *TÜM AKTİF ÖDEMELER*\n\n`;
      
      Object.keys(groupedChecks).forEach(dateStr => {
        message += `📆 *${dateStr}*\n`;
        
        groupedChecks[dateStr].forEach((check, index) => {
          message += `${index + 1}. ${check.name} - ${formatCurrency(check.amount)}\n`;
          if (check.notes) message += `   _${check.notes}_\n`;
        });
        
        message += `\n`;
      });
      
      message += `\n💰 *TOPLAM:* ${formatCurrency(activeChecks.reduce((sum, check) => sum + check.amount, 0))}`;
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /tumu veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  // /gecmis komutu
  telegramBot.onText(/\/gecmis/, (msg) => {
    console.log('🎯 /gecmis komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getChecksData().then(checks => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdueChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today && !check.isPaid;
      });
      
      if (overdueChecks.length === 0) {
        telegramBot.sendMessage(chatId, '✅ Vadesi geçmiş çek/fatura bulunmuyor.');
        return;
      }
      
      // Tarihe göre sırala
      overdueChecks.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      let message = `⚠️ *VADESİ GEÇMİŞ ÖDEMELER*\n\n`;
      
      overdueChecks.forEach((check, index) => {
        const checkDate = new Date(check.date).toLocaleDateString('tr-TR');
        message += `${index + 1}. ${check.name} - ${formatCurrency(check.amount)}\n`;
        message += `   📆 *Vade:* ${checkDate}\n`;
        if (check.notes) message += `   _${check.notes}_\n`;
        message += '\n';
      });
      
      message += `\n💰 *TOPLAM:* ${formatCurrency(overdueChecks.reduce((sum, check) => sum + check.amount, 0))}`;
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /gecmis veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  // /istatistik komutu
  telegramBot.onText(/\/istatistik/, (msg) => {
    console.log('🎯 /istatistik komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getChecksData().then(checks => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdueChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today && !check.isPaid;
      });
      
      const todayChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate.getTime() === today.getTime() && !check.isPaid;
      });
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const upcomingChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate > today && checkDate <= nextWeek && !check.isPaid;
      });
      
      const futureChecks = checks.filter(check => {
        const checkDate = new Date(check.date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate > nextWeek && !check.isPaid;
      });
      
      const paidChecks = checks.filter(check => check.isPaid);
      
      let message = `📊 *ÖDEME İSTATİSTİKLERİ*\n\n`;
      
      message += `⚠️ *Vadesi Geçmiş:* ${overdueChecks.length} adet - ${formatCurrency(overdueChecks.reduce((sum, check) => sum + check.amount, 0))}\n\n`;
      
      message += `📅 *Bugün:* ${todayChecks.length} adet - ${formatCurrency(todayChecks.reduce((sum, check) => sum + check.amount, 0))}\n\n`;
      
      message += `🔜 *7 Gün İçinde:* ${upcomingChecks.length} adet - ${formatCurrency(upcomingChecks.reduce((sum, check) => sum + check.amount, 0))}\n\n`;
      
      message += `📆 *Gelecek:* ${futureChecks.length} adet - ${formatCurrency(futureChecks.reduce((sum, check) => sum + check.amount, 0))}\n\n`;
      
      message += `✅ *Ödenmiş:* ${paidChecks.length} adet - ${formatCurrency(paidChecks.reduce((sum, check) => sum + check.amount, 0))}\n\n`;
      
      message += `📝 *Toplam Kayıt:* ${checks.length} adet\n`;
      message += `💰 *Toplam Tutar:* ${formatCurrency(checks.reduce((sum, check) => sum + check.amount, 0))}`;
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /istatistik veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  // İlaç komutları
  // /ilaclarim komutu
  telegramBot.onText(/\/ilaclarim/, (msg) => {
    console.log('🎯 /ilaclarim komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getMedicationsData().then(medications => {
      if (!medications || medications.length === 0) {
        telegramBot.sendMessage(chatId, '❌ Kayıtlı ilaç bulunmuyor.');
        return;
      }
      
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0: Pazar, 1: Pazartesi, ...
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      
      // Bugün alınması gereken ilaçları filtrele
      const todayMeds = medications.filter(med => {
        // İlacın bugün alınması gerekiyor mu?
        return (
          (med.days.sunday && dayOfWeek === 0) ||
          (med.days.monday && dayOfWeek === 1) ||
          (med.days.tuesday && dayOfWeek === 2) ||
          (med.days.wednesday && dayOfWeek === 3) ||
          (med.days.thursday && dayOfWeek === 4) ||
          (med.days.friday && dayOfWeek === 5) ||
          (med.days.saturday && dayOfWeek === 6)
        );
      });
      
      if (todayMeds.length === 0) {
        telegramBot.sendMessage(chatId, `📅 Bugün (${dayNames[dayOfWeek]}) almanız gereken ilaç bulunmuyor.`);
        return;
      }
      
      // Saate göre sırala
      todayMeds.sort((a, b) => {
        const timeA = a.time.split(':');
        const timeB = b.time.split(':');
        return (parseInt(timeA[0]) * 60 + parseInt(timeA[1])) - (parseInt(timeB[0]) * 60 + parseInt(timeB[1]));
      });
      
      let message = `💊 *BUGÜN ALINACAK İLAÇLAR*\n📅 ${dayNames[dayOfWeek]}, ${today.toLocaleDateString('tr-TR')}\n\n`;
      
      todayMeds.forEach((med, index) => {
        const timeText = (typeof med.time === 'string' && med.time) ? med.time : 'Zaman belirtilmemiş';
        message += `${index + 1}. *${med.name}* - ${timeText}\n`;
        if (med.dosage) message += `   💊 Doz: ${med.dosage}\n`;
        if (med.notes) message += `   📝 Not: _${med.notes}_\n`;
        message += '\n';
      });
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /ilaclarim veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  // /ilac_program komutu
  telegramBot.onText(/\/ilac_program/, (msg) => {
    console.log('🎯 /ilac_program komutu alındı:', msg.from.first_name);
    const chatId = msg.chat.id;
    
    // YENİ: Her komut için veriyi async olarak yeniden oku
    getMedicationsData().then(medications => {
      if (!medications || medications.length === 0) {
        telegramBot.sendMessage(chatId, '❌ Kayıtlı ilaç bulunmuyor.');
        return;
      }
      
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const today = new Date();
      const currentDayIndex = today.getDay();
      
      // Günleri bugünden başlayarak sırala
      const orderedDays = [
        { index: currentDayIndex, name: dayNames[currentDayIndex], key: 'sunday,monday,tuesday,wednesday,thursday,friday,saturday'.split(',')[currentDayIndex] }
      ];
      
      for (let i = 1; i <= 6; i++) {
        const dayIndex = (currentDayIndex + i) % 7;
        orderedDays.push({
          index: dayIndex,
          name: dayNames[dayIndex],
          key: 'sunday,monday,tuesday,wednesday,thursday,friday,saturday'.split(',')[dayIndex]
        });
      }
      
      let message = `📅 *HAFTALIK İLAÇ PROGRAMI*\n\n`;
      
      // Her gün için ilaçları listele (null-safe)
      orderedDays.forEach(day => {
        const dayMeds = medications.filter(med => {
          const days = med?.days || {};
          return (
            (day.index === 0 && days.sunday) ||
            (day.index === 1 && days.monday) ||
            (day.index === 2 && days.tuesday) ||
            (day.index === 3 && days.wednesday) ||
            (day.index === 4 && days.thursday) ||
            (day.index === 5 && days.friday) ||
            (day.index === 6 && days.saturday)
          );
        });
        
        // Saate göre sırala (null-safe)
        dayMeds.sort((a, b) => {
          const parseTime = (t) => {
            if (typeof t !== 'string' || !t.includes(':')) return Number.POSITIVE_INFINITY;
            const [h, m] = t.split(':');
            const hh = parseInt(h, 10);
            const mm = parseInt(m, 10);
            if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.POSITIVE_INFINITY;
            return hh * 60 + mm;
          };
          return parseTime(a.time) - parseTime(b.time);
        });
        
        if (dayMeds.length > 0) {
          message += `📅 ${day.name}\n`;
          dayMeds.forEach((med, index) => {
            const timeText = (typeof med.time === 'string' && med.time) ? med.time : 'Zaman belirtilmemiş';
            message += `${index + 1}. *${med.name}* - ${timeText}\n`;
            if (med.dosage) message += `   💊 Doz: ${med.dosage}\n`;
            if (med.notes) message += `   📝 Not: _${med.notes}_\n`;
            message += '\n';
          });
        } else {
          message += `📅 ${day.name}\n   ⛔ İlaç yok\n\n`;
        }
      });
      
      telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }).catch(error => {
      console.error('❌ /ilac_program veri hatası:', error.message);
      telegramBot.sendMessage(chatId, '❌ Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  });

  console.log('✅ Telegram komutları başarıyla kuruldu');
}

function sendTestMessage(chatId) {
  if (!telegramBot) {
    console.log('❌ Bot mevcut değil, test mesajı gönderilemedi');
    return;
  }
  
  console.log('📤 Test mesajı gönderiliyor...');
  
  const testMessage = `🤖 Hatırlatıcınım Bot bağlantısı başarılı!

⏰ Bildirimler bu kanala gönderilecek.
📅 ${new Date().toLocaleString('tr-TR')}`;

  telegramBot.sendMessage(chatId, testMessage)
    .then(() => {
      console.log('✅ Test mesajı gönderildi');
    })
    .catch(err => {
      console.error('❌ Test mesajı hatası:', err.message);
    });
}

// Yardımcı fonksiyonlar
function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
}

// Veri okuma fonksiyonları
function getChecksData() {
  return new Promise((resolve, reject) => {
    try {
      const appDataPath = getAppDataPath();
      const checksFilePath = path.join(appDataPath, 'checks.json');
      
      if (!fs.existsSync(checksFilePath)) {
        console.log('❌ Çek dosyası bulunamadı:', checksFilePath);
        resolve([]);
        return;
      }
      
      const checksData = fs.readFileSync(checksFilePath, 'utf8');
      const checks = JSON.parse(checksData);
      resolve(checks);
    } catch (error) {
      console.error('❌ Çek verisi okuma hatası:', error);
      reject(error);
    }
  });
}

function getMedicationsData() {
  return new Promise((resolve, reject) => {
    try {
      const appDataPath = getAppDataPath();
      const medsFilePath = path.join(appDataPath, 'medications.json');
      
      if (!fs.existsSync(medsFilePath)) {
        console.log('❌ İlaç dosyası bulunamadı:', medsFilePath);
        resolve([]);
        return;
      }
      
      const medsData = fs.readFileSync(medsFilePath, 'utf8');
      const medications = JSON.parse(medsData);
      resolve(medications);
    } catch (error) {
      console.error('❌ İlaç verisi okuma hatası:', error);
      reject(error);
    }
  });
}

function getSettingsData() {
  try {
    const appDataPath = getAppDataPath();
    const settingsFilePath = path.join(appDataPath, 'settings.json');
    
    if (!fs.existsSync(settingsFilePath)) {
      console.log('❌ Ayarlar dosyası bulunamadı:', settingsFilePath);
      return { telegramBotEnabled: false, telegramBotToken: null, telegramChatId: null };
    }
    
    const settingsData = fs.readFileSync(settingsFilePath, 'utf8');
    return JSON.parse(settingsData);
  } catch (error) {
    console.error('❌ Ayarlar okuma hatası:', error);
    return { telegramBotEnabled: false, telegramBotToken: null, telegramChatId: null };
  }
}

// Veri klasörünü oluştur
const appDataPath = getAppDataPath();
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
  console.log('📁 Veri klasörü oluşturuldu:', appDataPath);
}

// Uygulama başlangıcı
app.whenReady().then(() => {
  console.log('🚀 Uygulama başlatılıyor...');
  
  // Tray ikon yolu çözümlemesini üretim/geliştirme modları için sağlamlaştır ve Notification ikonunda aynı çözümü kullan. new Tray oluşturmayı try/catch ile sarmala.
  const { nativeImage } = require('electron');
  function resolveAssetPath(fileName) {
    try {
      const candidates = [
        process.resourcesPath ? path.join(process.resourcesPath, fileName) : null,
        path.join(__dirname, fileName),
      ].filter(Boolean);
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
      return path.join(__dirname, fileName);
    } catch (e) {
      return path.join(__dirname, fileName);
    }
  }
  
  function getTrayNativeImage() {
    const fileName = process.platform === 'win32' ? 'icon.ico' : 'icon-256x256.png';
    const iconPath = resolveAssetPath(fileName);
    let icon = nativeImage.createEmpty();
    try {
      const created = nativeImage.createFromPath(iconPath);
      if (!created.isEmpty()) {
        icon = created;
      }
    } catch (e) {
      console.error('❌ Tray icon yükleme hatası:', e);
    }
    return icon;
  }
  try {
    const trayIcon = getTrayNativeImage();
    tray = new Tray(trayIcon);
  
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Hatırlatıcınım', 
        enabled: false,
        icon: process.platform === 'win32' ? getTrayNativeImage().resize({ width: 16, height: 16 }) : null
      },
      { type: 'separator' },
      { 
        label: 'Göster', 
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
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
  
    tray.setToolTip('Hatırlatıcınım');
    tray.setContextMenu(contextMenu);
  
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
  } catch (e) {
    console.error('❌ Tray oluşturma hatası:', e);
  }
  
  // Ana pencereyi oluştur
  createWindow();
  
  // IPC olaylarını dinle
  setupIpcHandlers();
  
  // Otomatik güncelleme kontrolü
  setupAutoUpdater();
  
  // Telegram bot'u başlat
  if (TelegramBot) {
    setTimeout(() => {
      initializeTelegramBot();
    }, 5000); // 5 saniye sonra başlat
  }
});
ipcMain.handle('show-notification', async (event, title, body) => {
  try {
    if (Notification && Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: resolveAssetPath(process.platform === 'win32' ? 'icon.ico' : 'icon-256x256.png')
      });
      notification.show();
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
ipcMain.handle('app-version', () => {
  return app.getVersion();
});
ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true, message: 'Update check started' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true, message: 'Download started' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
ipcMain.handle('install-update', () => {
  try {
    autoUpdater.quitAndInstall();
    return { success: true, message: 'Installing update...' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
ipcMain.handle('save-app-data', async (event, key, data) => {
  try {
    const appDataPath = getAppDataPath();
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
    const fileName = key; // mevcut sürümde checks.json / medications.json / settings.json kullanılıyor
    const filePath = path.join(appDataPath, `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // Settings kaydedildiğinde Telegram bot'u yeniden başlat
    if (key === 'settings') {
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
    const appDataPath = getAppDataPath();
    const fileName = key;
    const filePath = path.join(appDataPath, `${fileName}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data);
    return parsedData;
  } catch (error) {
    console.error('❌ AppData load error:', error);
    return null;
  }
});

// Add IPC handlers for session management
ipcMain.handle('get-session', async () => {
  return session.get('supabase.session');
});

ipcMain.handle('set-session', async (event, sessionData) => {
  session.set('supabase.session', sessionData);
});

ipcMain.handle('delete-session', async () => {
  session.remove('supabase.session');
});
}

// Otomatik güncelleme
function setupAutoUpdater() {
  // Güncellemeler için olay dinleyicileri
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Güncellemeler kontrol ediliyor...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'checking-for-update');
    }
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('🆕 Güncelleme mevcut:', info.version);
    
    // Kullanıcıya bildir
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'update-available', info);
    }
  });
  
  autoUpdater.on('update-not-available', () => {
    console.log('✅ Uygulama güncel');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'update-not-available');
    }
  });
  
  autoUpdater.on('error', (err) => {
    console.error('❌ Güncelleme hatası:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'error', { message: err.message });
    }
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    const logMessage = `⏬ İndiriliyor: ${percent}%`;
    console.log(logMessage);
    
    // İlerlemeyi kullanıcıya bildir
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'download-progress', { percent });
    }
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Güncelleme indirildi:', info.version);
    
    // Kullanıcıya bildir ve yeniden başlatma seçeneği sun
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'update-downloaded', info);
      
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Güncelleme Hazır',
        message: `Hatırlatıcınım'ın yeni sürümü (${info.version}) indirildi. Şimdi yüklemek için uygulamayı yeniden başlatın.`,
        buttons: ['Şimdi Yeniden Başlat', 'Daha Sonra']
      }).then(result => {
        if (result.response === 0) {
          isQuitting = true;
          autoUpdater.quitAndInstall();
        }
      });
    }
  });
  
  // Güncelleme kontrolünü başlat
  setTimeout(() => {
    console.log('🔄 Otomatik güncelleme kontrolü başlatılıyor...');
    autoUpdater.checkForUpdates().catch(err => {
      console.error('❌ Güncelleme kontrolü hatası:', err);
    });
    
    // Her 6 saatte bir kontrol et
    setInterval(() => {
      console.log('🔄 Periyodik güncelleme kontrolü yapılıyor...');
      autoUpdater.checkForUpdates().catch(err => {
        console.error('❌ Periyodik güncelleme kontrolü hatası:', err);
      });
    }, 6 * 60 * 60 * 1000);
  }, 10000); // 10 saniye sonra başlat
}

// Arka plan bildirimleri
function startBackgroundNotifications() {
  console.log('🔔 Arka plan bildirimleri başlatılıyor...');
  
  // Her 15 dakikada bir kontrol et
  backgroundNotificationInterval = setInterval(() => {
    checkForDueChecks();
    checkForMedications();
  }, 15 * 60 * 1000);
  
  // İlk kontrolü hemen yap
  setTimeout(() => {
    checkForDueChecks();
    checkForMedications();
  }, 5000);
}

// Vadesi yaklaşan çekleri kontrol et
function checkForDueChecks() {
  console.log('🔍 Vadesi yaklaşan çekler kontrol ediliyor...');
  
  getChecksData().then(checks => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Bugün vadesi gelen çekler
    const todayChecks = checks.filter(check => {
      if (check.isPaid) return false;
      
      const checkDate = new Date(check.date);
      const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      
      return checkDateOnly.getTime() === today.getTime();
    });
    
    if (todayChecks.length > 0) {
      console.log(`⚠️ Bugün vadesi gelen ${todayChecks.length} çek bulundu`);
      
      // Bildirim gönder
      if (mainWindow) {
        mainWindow.webContents.send('check-notification', {
          title: 'Bugün Ödenecek Çekler',
          body: `${todayChecks.length} adet çek/fatura bugün ödenecek.`,
          checks: todayChecks
        });
      }
      
      // Sistem bildirimi
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: 'Bugün Ödenecek Çekler',
          body: `${todayChecks.length} adet çek/fatura bugün ödenecek.`,
          icon: path.join(__dirname, 'icon.ico')
        });
        
        notification.show();
        
        notification.on('click', () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('navigate-to-checks');
          }
        });
      }
      
      // Telegram bildirimi
      sendTelegramCheckNotification(todayChecks, 'today');
    }
    
    // Yarın vadesi gelecek çekler
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const tomorrowChecks = checks.filter(check => {
      if (check.isPaid) return false;
      
      const checkDate = new Date(check.date);
      const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      
      return checkDateOnly.getTime() === tomorrow.getTime();
    });
    
    if (tomorrowChecks.length > 0) {
      console.log(`⚠️ Yarın vadesi gelecek ${tomorrowChecks.length} çek bulundu`);
      
      // Bildirim gönder (sadece sabah 9'da)
      if (now.getHours() === 9 && now.getMinutes() < 15) {
        if (mainWindow) {
          mainWindow.webContents.send('check-notification', {
            title: 'Yarın Ödenecek Çekler',
            body: `${tomorrowChecks.length} adet çek/fatura yarın ödenecek.`,
            checks: tomorrowChecks
          });
        }
        
        // Sistem bildirimi
        if (Notification.isSupported()) {
          const notification = new Notification({
            title: 'Yarın Ödenecek Çekler',
            body: `${tomorrowChecks.length} adet çek/fatura yarın ödenecek.`,
            icon: path.join(__dirname, 'icon.ico')
          });
          
          notification.show();
          
          notification.on('click', () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to-checks');
            }
          });
        }
        
        // Telegram bildirimi (sadece sabah)
        sendTelegramCheckNotification(tomorrowChecks, 'tomorrow');
      }
    }
  }).catch(error => {
    console.error('❌ Çek kontrolü hatası:', error.message);
  });
}

// İlaçları kontrol et
function checkForMedications() {
  console.log('🔍 Alınması gereken ilaçlar kontrol ediliyor...');
  
  getMedicationsData().then(medications => {
    if (!medications || medications.length === 0) {
      return;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const dayOfWeek = now.getDay(); // 0: Pazar, 1: Pazartesi, ...
    
    // Şu anda alınması gereken ilaçları filtrele
    const currentMeds = medications.filter(med => {
      const days = med?.days || {};
      // İlacın bugün alınması gerekiyor mu?
      const isDueToday = (
        (days.sunday && dayOfWeek === 0) ||
        (days.monday && dayOfWeek === 1) ||
        (days.tuesday && dayOfWeek === 2) ||
        (days.wednesday && dayOfWeek === 3) ||
        (days.thursday && dayOfWeek === 4) ||
        (days.friday && dayOfWeek === 5) ||
        (days.saturday && dayOfWeek === 6)
      );
      
      if (!isDueToday) return false;
      
      // İlacın saati şu anki saatle uyuşuyor mu?
      if (!med?.time || typeof med.time !== 'string' || !med.time.includes(':')) return false;
      const [medHourStr, medMinuteStr] = med.time.split(':');
      const medHour = parseInt(medHourStr, 10);
      const medMinute = parseInt(medMinuteStr, 10);
      if (Number.isNaN(medHour) || Number.isNaN(medMinute)) return false;
      
      // Son 15 dakika içinde mi?
      const medTimeInMinutes = medHour * 60 + medMinute;
      const nowTimeInMinutes = currentHour * 60 + currentMinute;
      const timeDiffInMinutes = nowTimeInMinutes - medTimeInMinutes;
      
      return timeDiffInMinutes >= 0 && timeDiffInMinutes <= 15;
    });
    
    if (currentMeds.length > 0) {
      console.log(`⚠️ Şu anda alınması gereken ${currentMeds.length} ilaç bulundu`);
      
      // Bildirim gönder
      if (mainWindow) {
        mainWindow.webContents.send('medication-notification', {
          title: 'İlaç Hatırlatması',
          body: `${currentMeds.length} adet ilacınızı almanın zamanı geldi.`,
          medications: currentMeds
        });
      }
      
      // Sistem bildirimi
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: 'İlaç Hatırlatması',
          body: `${currentMeds.length} adet ilacınızı almanın zamanı geldi.`,
          icon: path.join(__dirname, 'icon.ico')
        });
        
        notification.show();
        
        notification.on('click', () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('navigate-to-medications');
          }
        });
      }
      
      // Telegram bildirimi
      sendTelegramMedicationNotification(currentMeds);
    }
  }).catch(error => {
    console.error('❌ İlaç kontrolü hatası:', error.message);
  });
}

// Telegram çek bildirimi gönder
function sendTelegramCheckNotification(checks, type) {
  if (!telegramBot) return;
  
  const settings = getSettingsData();
  if (!settings.telegramBotEnabled || !settings.telegramChatId) return;
  
  let title = '';
  if (type === 'today') {
    title = '📅 *BUGÜN ÖDENECEK ÇEK/FATURALAR*';
  } else if (type === 'tomorrow') {
    title = '📆 *YARIN ÖDENECEK ÇEK/FATURALAR*';
  }
  
  let message = `${title}\n\n`;
  
  checks.forEach((check, index) => {
    message += `${index + 1}. ${check.name} - ${formatCurrency(check.amount)}\n`;
    if (check.notes) message += `   _${check.notes}_\n`;
    message += '\n';
  });
  
  message += `\n💰 *TOPLAM:* ${formatCurrency(checks.reduce((sum, check) => sum + check.amount, 0))}`;
  
  telegramBot.sendMessage(settings.telegramChatId, message, { parse_mode: 'Markdown' })
    .then(() => {
      console.log('✅ Telegram çek bildirimi gönderildi');
    })
    .catch(err => {
      console.error('❌ Telegram çek bildirimi hatası:', err.message);
    });
}

// Telegram ilaç bildirimi gönder
function sendTelegramMedicationNotification(medications) {
  if (!telegramBot) return;
  
  const settings = getSettingsData();
  if (!settings.telegramBotEnabled || !settings.telegramChatId) return;
  
  let message = `💊 *İLAÇ HATIRLATMASI*\n\n`;
  
  medications.forEach((med, index) => {
    message += `${index + 1}. *${med.name}* - ${med.time}\n`;
    if (med.dosage) message += `   💊 Doz: ${med.dosage}\n`;
    if (med.notes) message += `   📝 Not: _${med.notes}_\n`;
    message += '\n';
  });
  
  telegramBot.sendMessage(settings.telegramChatId, message, { parse_mode: 'Markdown' })
    .then(() => {
      console.log('✅ Telegram ilaç bildirimi gönderildi');
    })
    .catch(err => {
      console.error('❌ Telegram ilaç bildirimi hatası:', err.message);
    });
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
    // Doğru yol: public klasöründen dist klasörüne
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('📁 Index dosyası yolu:', indexPath);
    console.log('📁 Dosya var mı?', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('❌ Index.html dosyası bulunamadı!');
      // Fallback olarak basit bir HTML yükle
      mainWindow.loadURL('data:text/html,<h1>Uygulama yükleniyor...</h1><p>Lütfen bekleyin.</p>');
    }
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
      
      // İlk kez minimize edildiğinde bilgi göster
      if (!mainWindow.hasShownTrayNotification) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'Hatırlatıcınız',
          content: 'Uygulama sistem tepsisinde çalışmaya devam ediyor.'
        });
        mainWindow.hasShownTrayNotification = true;
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Pencere yüklendiğinde
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('✅ Ana pencere yüklendi');
    
    // Auto-updater'ı başlat
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Hata durumunda
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Pencere yükleme hatası:', errorCode, errorDescription);
  });
}