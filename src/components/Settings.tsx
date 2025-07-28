import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      const handleUpdateStatus = (status: string, info?: any) => {
        console.log('Update status:', status, info);
        
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
          default:
            setUpdateStatus('idle');
            setUpdateMessage('');
        }
      };

      window.electronAPI.onUpdateStatus(handleUpdateStatus);

      // Cleanup
      return () => {
        if (window.electronAPI?.removeUpdateStatusListener) {
          window.electronAPI.removeUpdateStatusListener();
        }
      };
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
    if (!window.electronAPI) {
      alert('Güncelleme kontrolü sadece Electron uygulamasında çalışır.');
      return;
    }

    setUpdateStatus('checking');
    setUpdateMessage('Güncellemeler kontrol ediliyor...');

    try {
      await window.electronAPI.checkForUpdates();
      // Yanıt onUpdateStatus callback'i ile gelecek
    } catch (error) {
      setUpdateStatus('error');
      setUpdateMessage('Güncelleme kontrolü sırasında hata oluştu.');
      console.error('Update check error:', error);
    }
  };

  const testTelegramBot = async () => {
    if (!telegramBotToken || !telegramChatId) {
      alert('Lütfen önce Bot Token ve Chat ID girin!');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: '✅ Telegram Bot başarıyla bağlandı!\n\nKomutlar:\n/bugun - Bugün ödenecekler\n/yakin - Yaklaşan ödemeler\n/tumu - Tüm aktif ödemeler',
        }),
      });

      if (response.ok) {
        alert('✅ Test mesajı başarıyla gönderildi! Telegram\'ınızı kontrol edin.');
      } else {
        const error = await response.text();
        alert(`❌ Telegram bot testi başarısız:\n${error}`);
      }
    } catch (error) {
      alert(`❌ Telegram bot bağlantı hatası:\n${error}`);
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
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>Telegram'da <strong>@BotFather</strong>'a mesaj atın</li>
                  <li><code>/newbot</code> yazın ve bot adı verin</li>
                  <li>Verilen <strong>token</strong>'ı aşağıya yapıştırın</li>
                  <li>Bot'unuza <code>/start</code> mesajı atın</li>
                  <li><strong>Chat ID</strong> almak için "Test Et" butonuna basın</li>
                </ol>
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
                🧪 Bot'u Test Et
              </button>

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

          {/* Güncelleme Butonu */}
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

          {/* Bilgilendirme */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 <strong>Nasıl çalışır:</strong> Güncelleme varsa otomatik indirilir ve kuruluma hazır hale gelir. 
              Kurulum için uygulamayı yeniden başlatmanız istenecek.
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
