import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType, ThemeType } from '../types';
import { Bell, Download, Save, Upload, CheckCircle, RefreshCw, Palette, Info, MessageCircle, Clock, AlertCircle, ArrowDownCircle, Pill } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      showNotification: (title: string, body: string) => Promise<void>;
      checkForUpdates: () => Promise<{success: boolean, message: string}>;
      downloadUpdate: () => Promise<{success: boolean, message: string}>;
      installUpdate: () => Promise<{success: boolean, message: string}>;
      getVersion: () => Promise<string>;
      saveAppData: (key: string, data: any) => Promise<void>;
      loadAppData: (key: string) => Promise<any>;
    };
    ipcRenderer?: {
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

const themeOptions: { value: ThemeType; label: string; color: string }[] = [
  { value: 'light', label: 'Açık', color: '#ffffff' },
  { value: 'dark', label: 'Koyu', color: '#0f172a' },
  { value: 'gray', label: 'Gri', color: '#f3f4f6' },
  { value: 'blue', label: 'Mavi', color: '#ebf8ff' },
  { value: 'green', label: 'Yeşil', color: '#f0fdf4' },
  { value: 'orange', label: 'Turuncu', color: '#fff7ed' },
  { value: 'purple', label: 'Mor', color: '#faf5ff' },
];

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Settings({ settings, onSave, onExportData, onImportData }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(version => {
        setCurrentVersion(version);
      }).catch(() => {
        setCurrentVersion('Bilinmiyor');
      });
    }

    // Update status event listener
    if (window.ipcRenderer) {
      const handleUpdateStatus = (event: any, status: string, info?: any) => {
        console.log('🔄 Update status received:', status, info);
        setUpdateStatus(status);
        setUpdateInfo(info);
        
        if (status === 'download-progress' && info?.percent) {
          setDownloadProgress(info.percent);
        }
      };

      window.ipcRenderer.on('update-status', handleUpdateStatus);

      return () => {
        window.ipcRenderer?.removeAllListeners('update-status');
      };
    }
  }, []);

  const handleSettingChange = (key: keyof SettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSave(newSettings);
  };

  const handleCheckForUpdates = async () => {
    if (window.electronAPI?.checkForUpdates) {
      try {
        setUpdateStatus('checking-for-update');
        setUpdateInfo(null);
        setDownloadProgress(0);
        
        const result = await window.electronAPI.checkForUpdates();
        console.log('🔍 Check for updates result:', result);
      } catch (error) {
        console.error('❌ Check for updates error:', error);
        setUpdateStatus('error');
        setUpdateInfo({ message: 'Güncelleme kontrolü başarısız' });
      }
    }
  };

  const handleDownloadUpdate = async () => {
    if (window.electronAPI?.downloadUpdate) {
      try {
        setUpdateStatus('download-progress');
        setDownloadProgress(0);
        
        const result = await window.electronAPI.downloadUpdate();
        console.log('📥 Download update result:', result);
      } catch (error) {
        console.error('❌ Download update error:', error);
        setUpdateStatus('error');
        setUpdateInfo({ message: 'Güncelleme indirme başarısız' });
      }
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI?.installUpdate) {
      try {
        const result = await window.electronAPI.installUpdate();
        console.log('🔄 Install update result:', result);
        // Program yeniden başlayacak, bu noktaya gelmeyebilir
      } catch (error) {
        console.error('❌ Install update error:', error);
        setUpdateStatus('error');
        setUpdateInfo({ message: 'Güncelleme kurulumu başarısız' });
      }
    }
  };

  const testNotification = async () => {
    if (window.electronAPI?.showNotification) {
      try {
        await window.electronAPI.showNotification(
          'Test Bildirimi',
          'Bildirimler düzgün çalışıyor!'
        );
      } catch (error) {
        console.error('Bildirim test hatası:', error);
      }
    }
  };

  const testTelegramBot = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      alert('Önce Telegram Bot Token ve Chat ID\'yi giriniz');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: '🎉 Telegram Bot Test Mesajı\n\nBot düzgün çalışıyor! Ödeme hatırlatmaları bu şekilde gelecek.',
        }),
      });

      if (response.ok) {
        alert('✅ Telegram bot testi başarılı! Mesajı kontrol edin.');
      } else {
        alert('❌ Telegram bot testi başarısız. Token ve Chat ID\'yi kontrol edin.');
      }
    } catch (error) {
      alert('❌ Telegram bot test hatası: ' + error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="theme-primary rounded-lg p-2.5">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold theme-text">Ayarlar</h1>
            <p className="theme-text-muted text-sm">Uygulamanızı özelleştirin</p>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Tema
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSettingChange('theme', option.value)}
              className={`p-3 rounded-lg border transition-all text-sm ${
                settings.theme === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'theme-border theme-text hover:theme-bg-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: option.color }}
                />
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
        
        <p className="text-sm theme-text-muted mt-3">
          Seçtiğiniz tema tüm uygulamaya uygulanır
        </p>
      </div>

      {/* Notification Settings */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Bildirimler
        </h2>
        
        <div className="space-y-4">
          
          {/* Masaüstü Bildirimleri */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Masaüstü Bildirimleri</div>
              <div className="theme-text-muted text-sm">Ödeme tarihleri yaklaştığında bildirim al</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Kaç Gün Önceden Hatırlat */}
          {settings.notificationsEnabled && (
            <div className="pl-4 border-l-2 border-blue-200 space-y-3">
              <div>
                <label className="theme-text text-sm font-medium block mb-2">
                  Kaç gün önceden hatırlat?
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.reminderDays}
                    onChange={(e) => handleSettingChange('reminderDays', parseInt(e.target.value) || 1)}
                    className="theme-input w-20 text-center"
                  />
                  <span className="theme-text text-sm">gün önceden</span>
                </div>
                <p className="text-xs theme-text-muted mt-1">
                  1-30 gün arasında bir değer girebilirsiniz
                </p>
              </div>
              
              <button
                onClick={testNotification}
                className="theme-button-secondary px-4 py-2 text-sm"
              >
                Bildirim Testi
              </button>
            </div>
          )}

          {/* Günlük Bildiri */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Günlük Özet</div>
              <div className="theme-text-muted text-sm">Her gün bugünün ödemelerini hatırlat</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dailyNotificationEnabled}
                onChange={(e) => handleSettingChange('dailyNotificationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Günlük Bildirim Saati */}
          {settings.dailyNotificationEnabled && (
            <div className="pl-4 border-l-2 border-green-200">
              <label className="theme-text text-sm font-medium block mb-2">
                Günlük bildirim saati
              </label>
              <input
                type="time"
                value={settings.dailyNotificationTime}
                onChange={(e) => handleSettingChange('dailyNotificationTime', e.target.value)}
                className="theme-input w-32 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Medication Notifications */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Pill className="w-4 h-4" />
          İlaç Bildirimleri
        </h2>
        
        <div className="space-y-4">
          
          {/* İlaç Bildirimleri Aktif/Pasif */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">İlaç Hatırlatmaları</div>
              <div className="theme-text-muted text-sm">İlaç zamanları geldiğinde bildirim al</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.medicationNotificationsEnabled || false}
                onChange={(e) => handleSettingChange('medicationNotificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* İlaç Hatırlatma Süresi */}
          {(settings.medicationNotificationsEnabled || false) && (
            <div className="pl-4 border-l-2 border-blue-200 space-y-3">
              <div>
                <label className="theme-text text-sm font-medium block mb-2">
                  Kaç dakika önceden hatırlat?
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={settings.medicationReminderMinutes || 15}
                    onChange={(e) => handleSettingChange('medicationReminderMinutes', parseInt(e.target.value) || 15)}
                    className="theme-input w-20 text-center"
                  />
                  <span className="theme-text text-sm">dakika önceden</span>
                </div>
                <p className="text-xs theme-text-muted mt-1">
                  0-120 dakika arasında bir değer girebilirsiniz
                </p>
              </div>
            </div>
          )}

          {/* Dashboard'da İlaç Gösterimi */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Dashboard'da İlaç Widget'ları</div>
              <div className="theme-text-muted text-sm">Ana sayfada ilaç bilgilerini göster</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showMedicationsInDashboard !== false}
                onChange={(e) => handleSettingChange('showMedicationsInDashboard', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* İlaç Bildirimi Ses */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Bildirim Sesi</div>
              <div className="theme-text-muted text-sm">İlaç hatırlatmalarında ses çal</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.medicationSoundEnabled !== false}
                onChange={(e) => handleSettingChange('medicationSoundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Telegram Bot Settings */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Telegram Botu
        </h2>
        
        <div className="space-y-4">
          
          {/* Telegram Bot Aktif/Pasif */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Telegram Bot</div>
              <div className="theme-text-muted text-sm">Bildirimleri Telegram'dan al</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegramBotEnabled}
                onChange={(e) => handleSettingChange('telegramBotEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Telegram Bot Ayarları */}
          {settings.telegramBotEnabled && (
            <div className="pl-4 border-l-2 border-blue-200 space-y-4">
              
              <div>
                <label className="theme-text text-sm font-medium block mb-2">
                  Bot Token
                </label>
                <input
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={settings.telegramBotToken}
                  onChange={(e) => handleSettingChange('telegramBotToken', e.target.value)}
                  className="theme-input w-full text-sm"
                />
                <p className="text-xs theme-text-muted mt-1">
                  @BotFather'dan aldığınız bot token'ını girin
                </p>
              </div>

              <div>
                <label className="theme-text text-sm font-medium block mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  placeholder="123456789"
                  value={settings.telegramChatId}
                  onChange={(e) => handleSettingChange('telegramChatId', e.target.value)}
                  className="theme-input w-full text-sm"
                />
                <p className="text-xs theme-text-muted mt-1">
                  Kendi Telegram chat ID'nizi girin
                </p>
              </div>

              <button
                onClick={testTelegramBot}
                className="theme-button px-4 py-2 text-sm"
              >
                Telegram Bot Testi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Veri Yönetimi
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={onExportData}
              className="theme-button-secondary flex items-center justify-center gap-2 py-3"
            >
              <Download className="w-4 h-4" />
              Verileri Yedekle
            </button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportData}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="theme-button-secondary w-full flex items-center justify-center gap-2 py-3"
              >
                <Upload className="w-4 h-4" />
                Verileri Geri Yükle
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Yedekleme:</strong> Tüm çek ve fatura verilerinizi JSON dosyası olarak indirir.
                <br />
                <strong>Geri Yükleme:</strong> Daha önce yedeklediğiniz verileri geri yükler.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Updates */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Uygulama Güncellemeleri
        </h2>
        
        <div className="space-y-4">
          
          {/* Mevcut Sürüm */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Mevcut Sürüm</div>
              <div className="theme-text-muted text-sm">v{currentVersion}</div>
            </div>
            <button
              onClick={handleCheckForUpdates}
              disabled={updateStatus === 'checking-for-update'}
              className={`theme-button flex items-center gap-2 px-4 py-2 ${
                updateStatus === 'checking-for-update' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${updateStatus === 'checking-for-update' ? 'animate-spin' : ''}`} />
              {updateStatus === 'checking-for-update' ? 'Kontrol Ediliyor...' : 'Güncelleme Kontrol Et'}
            </button>
          </div>
          
          {updateStatus === 'checking-for-update' && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Güncelleme kontrolü yapılıyor...</span>
            </div>
          )}

          {updateStatus === 'update-available' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
                <ArrowDownCircle className="w-4 h-4" />
                <span className="text-sm">
                  Yeni güncelleme mevcut: v{updateInfo?.version || 'Bilinmiyor'}
                </span>
              </div>
              <button
                onClick={handleDownloadUpdate}
                className="theme-button w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Güncellemeyi İndir
              </button>
            </div>
          )}

          {updateStatus === 'download-progress' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <ArrowDownCircle className="w-4 h-4" />
                <span className="text-sm">Güncelleme indiriliyor... {Math.round(downloadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {updateStatus === 'update-downloaded' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  Güncelleme hazır! Şimdi yeniden başlatın.
                </span>
              </div>
              <button
                onClick={handleInstallUpdate}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Güncelle ve Yeniden Başlat
              </button>
            </div>
          )}

          {updateStatus === 'update-not-available' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Programınız güncel!</span>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Hata: {updateInfo?.message || 'Bilinmiyor'}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Otomatik Güncelleme:</strong> Yeni sürümler GitHub'dan kontrol edilir.
                <br />
                <strong>Veri Güvenliği:</strong> Güncellemeler sırasında verileriniz korunur.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
