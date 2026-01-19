import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType } from '../types';
import { Bell, Download, Save, Upload, CheckCircle, RefreshCw, Palette, Info, MessageCircle, AlertCircle, ArrowDownCircle, Pill } from 'lucide-react';

type UpdateStatus =
  | 'idle'
  | 'checking-for-update'
  | 'update-available'
  | 'download-progress'
  | 'update-downloaded'
  | 'update-not-available'
  | 'error';

type UpdateInfo = {
  version?: string;
  percent?: number;
  message?: string;
} | null;

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => Promise<void> | void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Settings({ settings, onSave, onExportData, onImportData }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

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
      const handleUpdateStatus = (...args: unknown[]) => {
        const status = String(args[1]) as UpdateStatus;
        const info = (args[2] as UpdateInfo) ?? null;
        console.log('🔄 Update status received:', status, info);
        setUpdateStatus(status);
        setUpdateInfo(info);
        
        if (status === 'download-progress' && info && info.percent) {
          setDownloadProgress(info.percent);
        }
      };

      window.ipcRenderer.on('update-status', handleUpdateStatus);

      return () => {
        window.ipcRenderer?.removeAllListeners('update-status');
      };
    }
  }, []);

  // Sistem başlangıcı: OS durumunu oku ve UI'yi senkronize et
  useEffect(() => {
    const syncLaunchState = async () => {
      try {
        if (window.electronAPI?.getLaunchOnStartup) {
          const result: { success: boolean; openAtLogin?: boolean } | undefined = await window.electronAPI.getLaunchOnStartup();
          if (result?.success && typeof result.openAtLogin === 'boolean') {
            setLocalSettings(prev => ({ ...prev, launchOnStartup: result.openAtLogin }));
          }
        }
      } catch {
        // sessizce geç
      }
    };
    syncLaunchState();
  }, []);

  const handleSettingChange = (key: keyof SettingsType, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="theme-primary rounded-lg p-2.5">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold theme-text">Ayarlar</h1>
              <p className="theme-text-muted text-sm">Uygulamanızı özelleştirin</p>
            </div>
          </div>
          <button
            onClick={() => onSave(localSettings)}
            className="theme-button px-4 py-2 text-sm"
            title="Değişiklikleri kaydet"
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* Appearance Settings - Restored Light/Dark Mode */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Görünüm
        </h2>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="theme-text font-medium">Tema Tercihi</div>
            <div className="theme-text-muted text-sm">Aydınlık veya karanlık mod seçin</div>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            <button
              onClick={() => handleSettingChange('theme', 'light')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                localSettings.theme === 'light'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Aydınlık
            </button>
            <button
              onClick={() => handleSettingChange('theme', 'dark')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                localSettings.theme === 'dark'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Karanlık
            </button>
          </div>
        </div>
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
                checked={localSettings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Kaç Gün Önceden Hatırlat */}
          {localSettings.notificationsEnabled && (
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
                    value={localSettings.reminderDays}
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
                checked={localSettings.dailyNotificationEnabled}
                onChange={(e) => handleSettingChange('dailyNotificationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Günlük Bildirim Saati */}
          {localSettings.dailyNotificationEnabled && (
            <div className="pl-4 border-l-2 border-green-200">
              <label className="theme-text text-sm font-medium block mb-2">
                Günlük bildirim saati
              </label>
              <input
                type="time"
                value={localSettings.dailyNotificationTime}
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
                checked={localSettings.medicationNotificationsEnabled || false}
                onChange={(e) => handleSettingChange('medicationNotificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* İlaç Hatırlatma Süresi */}
          {(localSettings.medicationNotificationsEnabled || false) && (
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
                    value={localSettings.medicationReminderMinutes || 15}
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
                checked={localSettings.showMedicationsInDashboard !== false}
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
                checked={localSettings.medicationSoundEnabled !== false}
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
                checked={localSettings.telegramBotEnabled}
                onChange={(e) => handleSettingChange('telegramBotEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Telegram Bot Ayarları */}
          {localSettings.telegramBotEnabled && (
            <div className="pl-4 border-l-2 border-blue-200 space-y-4">
              
              <div>
                <label className="theme-text text-sm font-medium block mb-2">
                  Bot Token
                </label>
                <input
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={localSettings.telegramBotToken}
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
                  value={localSettings.telegramChatId}
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
          {/* Auto Delete Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="theme-text text-sm font-medium block mb-2">
                Otomatik Silme (Gün)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={localSettings.autoDeleteAfterDays ?? 0}
                onChange={(e) => handleSettingChange('autoDeleteAfterDays', Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="theme-input w-full text-sm"
              />
              <p className="text-xs theme-text-muted mt-1">
                Ödeme <strong>ödenmiş</strong> olarak işaretlendikten sonra, ödeme tarihinden
                belirtilen gün sayısı geçtiğinde otomatik olarak silinir. Devre dışı bırakmak için 0 yazın.
              </p>
            </div>
          </div>

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

      {/* Sistem ve Başlangıç */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Sistem ve Başlangıç
        </h2>

        <div className="space-y-4">
          {/* Windows açılışında otomatik başlat */}
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Başlangıçta Otomatik Başlat</div>
              <div className="theme-text-muted text-sm">Bilgisayar açıldığında uygulamayı otomatik başlat</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!localSettings.launchOnStartup}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  handleSettingChange('launchOnStartup', enabled);
                  try {
                    if (window.electronAPI?.setLaunchOnStartup) {
                      await window.electronAPI.setLaunchOnStartup(enabled);
                    }
                  } catch {}
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
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
