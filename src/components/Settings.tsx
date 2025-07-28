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
      // Eğer chat ID yoksa, önce chat ID almaya çalış
      if (!telegramChatId) {
        const updatesResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getUpdates`);
        
        if (!updatesResponse.ok) {
          const error = await updatesResponse.text();
          alert(`❌ Bot token hatası:\n${error}\n\nLütfen:\n1. Bot token'ının doğru olduğunu kontrol edin\n2. Bot'unuza Telegram'da /start mesajı attığınızdan emin olun`);
          return;
        }

        const updatesData = await updatesResponse.json();
        
        if (updatesData.result && updatesData.result.length > 0) {
          // En son mesajdan chat ID'yi al
          const lastMessage = updatesData.result[updatesData.result.length - 1];
          const foundChatId = lastMessage.message?.chat?.id || lastMessage.callback_query?.message?.chat?.id;
          
          if (foundChatId) {
            setTelegramChatId(foundChatId.toString());
            alert(`✅ Chat ID bulundu: ${foundChatId}\n\nChat ID otomatik olarak dolduruldu. Şimdi "Test Et" butonuna tekrar basın!`);
            return;
          } else {
            alert(`⚠️ Chat ID bulunamadı!\n\nLütfen:\n1. Telegram'da bot'unuza /start mesajı atın\n2. "Merhaba" veya herhangi bir mesaj gönderin\n3. Bu butona tekrar basın`);
            return;
          }
        } else {
          alert(`📭 Henüz mesaj yok!\n\nLütfen:\n1. Telegram'da bot'unuzu bulun\n2. Bot'a /start mesajı atın\n3. "Merhaba" yazın\n4. Bu butona tekrar basın`);
          return;
        }
      }

      // Chat ID varsa normal test yap
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: '✅ Telegram Bot başarıyla bağlandı!\n\n🤖 Komutlar:\n/bugun - Bugün ödenecekler\n/yakin - Yaklaşan ödemeler\n/tumu - Tüm aktif ödemeler\n/gecmis - Vadesi geçenler\n/istatistik - Genel özet\n\n🎉 Bot hazır!',
        }),
      });

      if (response.ok) {
        alert('✅ Test mesajı başarıyla gönderildi! Telegram\'ınızı kontrol edin.');
      } else {
        const error = await response.text();
        alert(`❌ Test başarısız:\n${error}`);
      }
    } catch (error) {
      alert(`❌ Bağlantı hatası:\n${error}\n\nİnternet bağlantınızı kontrol edin.`);
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
                  <li><strong>Telegram'da @BotFather'a</strong> mesaj atın</li>
                  <li><strong>/newbot</strong> yazın ve bot'unuza isim verin</li>
                  <li>Verilen <strong>token</strong>'ı aşağıya yapıştırın</li>
                  <li><strong>Bot'unuzu bulun</strong> (link verilecek) ve <strong>/start</strong> yazın</li>
                  <li><strong>"Merhaba"</strong> veya herhangi bir mesaj gönderin</li>
                  <li><strong>"Test Et"</strong> butonuna basın → Chat ID otomatik bulunacak!</li>
                </ol>
                <div className="mt-3 p-2 bg-green-100 rounded border-l-4 border-green-400">
                  <p className="text-xs text-green-700">
                    💡 <strong>Önemli:</strong> Chat ID'yi manuel girmenize gerek yok! 
                    Bot'a mesaj attıktan sonra "Test Et" butonu otomatik bulacak.
                  </p>
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
