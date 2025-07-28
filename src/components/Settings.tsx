import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsType } from '../types';

// Global type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      showNotification: (title: string, body: string) => Promise<void>;
      checkForUpdates: () => Promise<any>;
      onUpdateStatus: (callback: (status: string, info?: any) => void) => void;
      removeUpdateStatusListener: () => void;
      [key: string]: any;
    };
  }
}

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
}

export default function Settings({ settings, onSave, onExportData, onImportData }: SettingsProps) {
  const [reminderDays, setReminderDays] = useState(settings.reminderDays);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(settings.autoUpdateEnabled);
  const [dailyNotificationEnabled, setDailyNotificationEnabled] = useState(settings.dailyNotificationEnabled || false);
  const [dailyNotificationTime, setDailyNotificationTime] = useState(settings.dailyNotificationTime || '09:00');
  
  // Telegram bot state'leri
  const [telegramBotEnabled, setTelegramBotEnabled] = useState(settings.telegramBotEnabled || false);
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken || '');
  const [telegramChatId, setTelegramChatId] = useState(settings.telegramChatId || '');

  // Güncelleme durumu
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'error'>('idle');
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Güncel updateStatus değerini timeout'ta kullanmak için
  const updateStatusRef = useRef(updateStatus);
  updateStatusRef.current = updateStatus;

  useEffect(() => {
    console.log('Settings useEffect başlatıldı');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('window.electronAPI?.onUpdateStatus:', !!window.electronAPI?.onUpdateStatus);
    
    if (window.electronAPI?.onUpdateStatus) {
      const handleUpdateStatus = (status: string, info?: any) => {
        console.log('Update status alındı:', status, info);
        
        switch (status) {
          case 'checking':
            setUpdateStatus('checking');
            setUpdateMessage('Güncellemeler kontrol ediliyor...');
            break;
          case 'update-available':
            setUpdateStatus('available');
            setUpdateMessage(`Yeni güncelleme mevcut: v${info?.version || 'Bilinmiyor'}`);
            break;
          case 'not-available':
            setUpdateStatus('not-available');
            setUpdateMessage('En son sürümü kullanıyorsunuz.');
            break;
          case 'error':
            setUpdateStatus('error');
            setUpdateMessage(`Hata: ${info || 'Güncelleme kontrolü başarısız'}`);
            break;
          case 'download-progress':
            setUpdateStatus('checking');
            setUpdateMessage(`İndiriliyor... %${Math.round(info?.percent || 0)}`);
            break;
          case 'update-downloaded':
            setUpdateStatus('available');
            setUpdateMessage('Güncelleme indirildi! Uygulamayı yeniden başlatın.');
            break;
          default:
            console.log('Bilinmeyen update status:', status);
            setUpdateStatus('idle');
            setUpdateMessage('');
        }
      };

      console.log('Event listener kuruldu');
      window.electronAPI.onUpdateStatus(handleUpdateStatus);

      // Cleanup
      return () => {
        console.log('Event listener temizleniyor');
        if (window.electronAPI?.removeUpdateStatusListener) {
          window.electronAPI.removeUpdateStatusListener();
        }
      };
    } else {
      console.log('electronAPI.onUpdateStatus mevcut değil!');
    }
  }, []);

  const handleSave = () => {
    onSave({
      reminderDays,
      notificationsEnabled,
      autoUpdateEnabled,
      dailyNotificationEnabled,
      dailyNotificationTime,
      lastNotificationCheck: settings.lastNotificationCheck || '',
      telegramBotEnabled,
      telegramBotToken,
      telegramChatId,
    });
    alert('Ayarlar kaydedildi!');
  };

  const handleCheckUpdates = async () => {
    console.log('handleCheckUpdates başlatıldı');
    console.log('window.electronAPI mevcut mu:', !!window.electronAPI);
    
    if (!window.electronAPI) {
      setUpdateStatus('error');
      setUpdateMessage('Güncelleme sadece Electron uygulamasında çalışır. Web tarayıcısında çalışmıyor.');
      return;
    }

    setUpdateStatus('checking');
    setUpdateMessage('Güncellemeler kontrol ediliyor...');

    try {
      console.log('checkForUpdates çağrılıyor...');
      const result = await window.electronAPI.checkForUpdates();
      console.log('checkForUpdates sonuç:', result);
      
      // Eğer event listener çalışmıyorsa, manual timeout ekle
      setTimeout(() => {
        if (updateStatusRef.current === 'checking') {
          console.log('Timeout: Event listener çalışmıyor, manual güncelleştirme yapılıyor');
          setUpdateStatus('not-available');
          setUpdateMessage('Güncelleme kontrolü tamamlandı. Event sistem çalışmıyor, manuel kontrol yapın.');
        }
      }, 10000); // 10 saniye timeout
      
    } catch (error) {
      console.error('Update check error:', error);
      setUpdateStatus('error');
      setUpdateMessage(`Güncelleme kontrolü hatası: ${error.message || error}`);
    }
  };

  const testTelegramBot = async () => {
    if (!telegramBotToken) {
      alert('Lütfen önce Bot Token girin!');
      return;
    }

    try {
      console.log('Bot test başlatıldı, token:', telegramBotToken.substring(0, 10) + '...');

      // 1. Bot bilgilerini kontrol et (getMe)
      console.log('1. Bot bilgileri kontrol ediliyor...');
      const botInfoResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getMe`);
      
      if (!botInfoResponse.ok) {
        const errorText = await botInfoResponse.text();
        console.error('getMe API hatası:', errorText);
        alert(`❌ Bot token hatası!\n\nHata: ${errorText}\n\n✅ Çözüm:\n1. @BotFather'dan yeni token alın\n2. Token'ı doğru kopyaladığınızdan emin olun\n3. Token boşluk/enter içermesin`);
        return;
      }
      
      const botInfo = await botInfoResponse.json();
      console.log('Bot bilgileri:', botInfo);
      
      if (!botInfo.ok) {
        alert(`❌ Bot token geçersiz!\n\nBot yanıtı: ${botInfo.description}\n\n✅ @BotFather'dan yeni token alın.`);
        return;
      }

      alert(`✅ Bot bulundu!\n\n🤖 Bot Adı: ${botInfo.result.first_name}\n📝 Username: @${botInfo.result.username}\n\n👆 Şimdi bu bota Telegram'da mesaj atın!`);

      // 2. Webhook kontrolü ve temizleme
      console.log('2. Webhook durumu kontrol ediliyor...');
      const webhookResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getWebhookInfo`);
      if (webhookResponse.ok) {
        const webhookInfo = await webhookResponse.json();
        console.log('Webhook info:', webhookInfo);
        
        if (webhookInfo.result && webhookInfo.result.url) {
          console.log('Webhook aktif, temizleniyor...');
          const deleteWebhook = await fetch(`https://api.telegram.org/bot${telegramBotToken}/deleteWebhook`);
          console.log('Webhook silme sonucu:', await deleteWebhook.json());
        }
      }

      // 3. Chat ID bulma - çoklu yöntem
      if (!telegramChatId) {
        console.log('3. Chat ID aranıyor...');
        
        // 3a. getUpdates ile ara
        const updatesResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getUpdates?limit=100`);
        
        if (!updatesResponse.ok) {
          const error = await updatesResponse.text();
          alert(`❌ getUpdates hatası:\n${error}\n\nBot'a Telegram'da mesaj attığınızdan emin olun!`);
          return;
        }

        const updatesData = await updatesResponse.json();
        console.log('Updates data:', updatesData);
        
        if (updatesData.result && updatesData.result.length > 0) {
          // Tüm mesajları kontrol et ve chat ID'leri topla
          const chatIds = new Set();
          updatesData.result.forEach(update => {
            const chatId = update.message?.chat?.id || 
                          update.edited_message?.chat?.id || 
                          update.callback_query?.message?.chat?.id ||
                          update.channel_post?.chat?.id;
            if (chatId) {
              chatIds.add(chatId.toString());
            }
          });
          
          if (chatIds.size > 0) {
            const chatIdArray = Array.from(chatIds);
            const foundChatId = chatIdArray[chatIdArray.length - 1]; // En son bulunan
            
            setTelegramChatId(foundChatId);
            alert(`✅ Chat ID bulundu: ${foundChatId}\n\n${chatIdArray.length > 1 ? `(${chatIdArray.length} farklı chat bulundu, en son kullanılan seçildi)` : ''}\n\nŞimdi "Test Et" butonuna tekrar basın!`);
            return;
          }
        }
        
        // 3b. Manuel chat ID bulma rehberi
        alert(`📭 Henüz mesaj bulunamadı!\n\n🔧 Manual Chat ID bulma:\n\n1️⃣ Telegram'da @userinfobot'a gidin\n2️⃣ Bot'a /start yazın\n3️⃣ Size Chat ID'nizi verecek\n4️⃣ O ID'yi buraya girin\n\n📱 Alternatif:\n1️⃣ @${botInfo.result.username} bot'unuza git\n2️⃣ /start yazın\n3️⃣ "Merhaba" yazın\n4️⃣ Bu butona tekrar basın`);
        return;
      }

      // 4. Chat ID varsa test mesajı gönder
      console.log('4. Test mesajı gönderiliyor...');
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `✅ Telegram Bot başarıyla bağlandı!\n\n🤖 Bot: @${botInfo.result.username}\n👤 Chat ID: ${telegramChatId}\n\n📋 Komutlar:\n/bugun - Bugün ödenecekler\n/yakin - Yaklaşan ödemeler\n/tumu - Tüm aktif ödemeler\n/gecmis - Vadesi geçenler\n/istatistik - Genel özet\n\n🎉 Bot hazır ve çalışıyor!`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test mesajı gönderildi:', result);
        alert('✅ Test mesajı başarıyla gönderildi! Telegram\'ınızı kontrol edin.\n\n🎉 Bot artık aktif ve çalışıyor!');
      } else {
        const error = await response.text();
        console.error('Test mesajı hatası:', error);
        alert(`❌ Test mesajı gönderilemedi:\n${error}\n\nChat ID doğru mu: ${telegramChatId}`);
      }
      
    } catch (error) {
      console.error('Telegram bot test hatası:', error);
      alert(`❌ Bağlantı hatası:\n${error}\n\n🔧 Kontrol edin:\n• İnternet bağlantınız\n• Bot token doğru mu\n• Telegram erişilebilir mi`);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onImportData(data);
        } catch (error) {
          alert('Dosya okuma hatası!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Genel Ayarlar</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kaç gün önceden hatırlatsın?
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ödeme tarihinden {reminderDays} gün önce bildirim gelir
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoUpdate"
              checked={autoUpdateEnabled}
              onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoUpdate" className="ml-2 text-sm text-gray-700">
              Otomatik güncellemeler (önerilen)
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔔 Bildirim Ayarları</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
              Masaüstü bildirimlerini etkinleştir
            </label>
          </div>

          {notificationsEnabled && (
            <div className="ml-6 pl-4 border-l-2 border-blue-100 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="dailyNotifications"
                  checked={dailyNotificationEnabled}
                  onChange={(e) => setDailyNotificationEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="dailyNotifications" className="ml-2 text-sm text-gray-700">
                  Günlük bildirim (o gün ödeme varsa)
                </label>
              </div>

              {dailyNotificationEnabled && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Günlük bildirim saati:
                  </label>
                  <input
                    type="time"
                    value={dailyNotificationTime}
                    onChange={(e) => setDailyNotificationTime(e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Her gün {dailyNotificationTime} saatinde kontrol edilir
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Bildirim Davranışı:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Hatırlatma</strong>: Ödeme tarihinden {reminderDays} gün önce (tek seferlik)</li>
                  <li>• <strong>Ödeme Günü</strong>: Ödeme tarihi geldiğinde (tek seferlik)</li>
                  {dailyNotificationEnabled && (
                    <li>• <strong>Günlük</strong>: Her gün {dailyNotificationTime}'da o gün ödeme varsa</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Bot Ayarları */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🤖 Telegram Bot</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="telegramBot"
              checked={telegramBotEnabled}
              onChange={(e) => setTelegramBotEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="telegramBot" className="ml-2 text-sm text-gray-700">
              Telegram bot bildirimlerini etkinleştir
            </label>
          </div>

          {telegramBotEnabled && (
            <div className="ml-6 pl-4 border-l-2 border-green-100 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-2">📋 Bot Kurulum Adımları:</h4>
                <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                  <li><strong>@BotFather'a mesaj atın</strong> ve <code>/newbot</code> yazın</li>
                  <li><strong>Bot token'ını</strong> aşağıya yapıştırın</li>
                  <li><strong>"Test Et"</strong> butonuna basın → Bot bilgileri kontrol edilir</li>
                  <li><strong>Bot'unuza mesaj atın</strong> (/start, merhaba vs.)</li>
                  <li><strong>"Test Et"</strong> butonuna tekrar basın → Chat ID otomatik bulunur</li>
                </ol>
                
                <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">🔧 Chat ID Bulunamıyorsa:</h5>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>@userinfobot</strong>'a /start yazın → Chat ID'nizi verir</li>
                    <li>• <strong>@chatid_echo_bot</strong>'a mesaj atın → Chat ID döner</li>
                    <li>• Manuel olarak aşağıya yazın ve test edin</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token:
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  @BotFather'dan alacağınız token
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID:
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Kendi Telegram Chat ID'niz
                </p>
              </div>

              <button
                onClick={testTelegramBot}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                {!telegramChatId ? '🔍 Chat ID Bul & Test Et' : '🧪 Bot\'u Test Et'}
              </button>

              {!telegramChatId && (
                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Chat ID bulunamadı.</strong> Önce bot'unuza Telegram'da mesaj atın, 
                    sonra yukarıdaki butona basın.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">🤖 Bot Komutları:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <code>/bugun</code> - Bugün ödenecek çek/faturalar</li>
                  <li>• <code>/yakin</code> - 7 gün içinde ödenecekler</li>
                  <li>• <code>/tumu</code> - Tüm aktif ödemeler</li>
                  <li>• <code>/gecmis</code> - Vadesi geçen ödemeler</li>
                  <li>• <code>/istatistik</code> - Genel özet</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Basitleştirilmiş Güncelleme Bölümü */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 Uygulama Güncelleme</h2>
        
        <div className="space-y-4">
          {/* Debug Panel */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                🔍 Debug Bilgileri (Geliştirici)
              </summary>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <div>• Electron API Mevcut: {window.electronAPI ? '✅ Evet' : '❌ Hayır'}</div>
                <div>• Update Event Handler: {window.electronAPI?.onUpdateStatus ? '✅ Evet' : '❌ Hayır'}</div>
                <div>• Mevcut Durum: {updateStatus}</div>
                <div>• Son Mesaj: {updateMessage || 'Henüz mesaj yok'}</div>
              </div>
            </details>
          </div>

          {/* Güncelleme Durumu */}
          {updateMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              updateStatus === 'checking' ? 'bg-blue-50 text-blue-800' :
              updateStatus === 'available' ? 'bg-green-50 text-green-800' :
              updateStatus === 'not-available' ? 'bg-gray-50 text-gray-800' :
              updateStatus === 'error' ? 'bg-red-50 text-red-800' :
              'bg-gray-50 text-gray-800'
            }`}>
              {updateStatus === 'checking' && '⏳ '}
              {updateStatus === 'available' && '✅ '}
              {updateStatus === 'not-available' && 'ℹ️ '}
              {updateStatus === 'error' && '❌ '}
              {updateMessage}
            </div>
          )}

          {/* Güncelleme Butonları */}
          <div className="space-y-2">
            <button
              onClick={handleCheckUpdates}
              disabled={updateStatus === 'checking'}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                updateStatus === 'checking'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {updateStatus === 'checking' ? '⏳ Kontrol Ediliyor...' : '🔍 Güncellemeleri Kontrol Et'}
            </button>

            {/* Manuel GitHub Kontrolü */}
            <button
              onClick={() => {
                window.open('https://github.com/EnesYORNUK/Hatirlaticiniz/releases/latest', '_blank');
              }}
              className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              🌐 GitHub'da Manuel Kontrol Et
            </button>
          </div>

          {/* Bilgilendirme */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 <strong>Nasıl çalışır:</strong> Güncelleme varsa otomatik indirilir ve kuruluma hazır hale gelir. 
              Kurulum için uygulamayı yeniden başlatmanız istenecek.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ <strong>Sorun varsa:</strong> F12 tuşuna basın, Console sekmesini açın ve debug bilgilerini kontrol edin.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">💾 Veri Yedekleme</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onExportData}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              📤 Verileri Dışa Aktar
            </button>
            
            <label className="bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer text-center">
              📥 Verileri İçe Aktar
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
          
          <p className="text-sm text-gray-500">
            Verilerinizi düzenli olarak yedeklemenizi öneririz.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          💾 Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}
