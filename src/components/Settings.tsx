import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType, ThemeType } from '../types';
import { Bell, Download, Save, Upload, Download as DownloadIcon, CheckCircle, AlertCircle, RefreshCw, Loader, Info, Palette } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      showNotification: (title: string, body: string) => Promise<void>;
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateStatus: (callback: (status: string, info?: any) => void) => void;
      removeUpdateStatusListener: () => void;
      getVersion: () => Promise<string>;
      saveAppData: (key: string, data: any) => Promise<void>;
      loadAppData: (key: string) => Promise<any>;
    };
  }
}

const themeOptions: { value: ThemeType; label: string; emoji: string; description: string }[] = [
  { value: 'light', label: 'Açık Tema', emoji: '🌅', description: 'Klasik beyaz tema' },
  { value: 'dark', label: 'Koyu Tema', emoji: '🌙', description: 'Göz yormayan karanlık tema' },
  { value: 'blue', label: 'Mavi Tema', emoji: '🔵', description: 'Profesyonel mavi tonları' },
  { value: 'green', label: 'Yeşil Tema', emoji: '🟢', description: 'Doğal yeşil renkleri' },
  { value: 'orange', label: 'Turuncu Tema', emoji: '🟠', description: 'Enerjik turuncu tonları' },
  { value: 'purple', label: 'Mor Tema', emoji: '🟣', description: 'Kreatif mor renkleri' },
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
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(version => {
        setCurrentVersion(version);
      }).catch(err => {
        setCurrentVersion('Bilinmiyor');
      });
    }

    if (window.electronAPI?.onUpdateStatus) {
      const handleUpdateStatus = (status: string, info?: any) => {
        setUpdateStatus(status);
        setUpdateInfo(info);
        
        switch (status) {
          case 'checking-for-update':
            setUpdateMessage('Güncellemeler kontrol ediliyor...');
            break;
          case 'update-available':
            setUpdateMessage(`Yeni güncelleme mevcut: v${info?.version || 'Bilinmiyor'}`);
            break;
          case 'update-not-available':
            setUpdateMessage('Programınız güncel! 🎉');
            break;
          case 'download-progress':
            const percent = Math.round(info?.percent || 0);
            setUpdateMessage(`Güncelleme indiriliyor... %${percent}`);
            break;
          case 'update-downloaded':
            setUpdateMessage('Güncelleme hazır! Yeniden başlatın.');
            break;
          case 'error':
            setUpdateMessage(`Hata oluştu: ${info?.message || 'Bilinmeyen hata'}`);
            break;
          default:
            setUpdateMessage(`Durum: ${status}`);
        }
      };

      window.electronAPI.onUpdateStatus(handleUpdateStatus);

      return () => {
        if (window.electronAPI?.removeUpdateStatusListener) {
          window.electronAPI.removeUpdateStatusListener();
        }
      };
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (window.electronAPI?.checkForUpdates) {
      try {
        setUpdateStatus('checking-for-update');
        setUpdateMessage('Güncellemeler kontrol ediliyor...');
        
        const result = await window.electronAPI.checkForUpdates();
        
        if (result.success) {
          // autoUpdater event'leri status'u handle edecek
        } else {
          setUpdateStatus('error');
          setUpdateMessage(`Güncelleme kontrolü başarısız: ${result.message}`);
        }
        
      } catch (error: any) {
        setUpdateStatus('error');
        setUpdateMessage(`Güncelleme kontrolü hatası: ${error.message}`);
      }
    } else {
      setUpdateStatus('error');
      setUpdateMessage('Güncelleme sistemi sadece masaüstü uygulamasında çalışır.');
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI?.installUpdate) {
      try {
        await window.electronAPI.installUpdate();
      } catch (error) {
        setUpdateMessage('Güncelleme kurulumu başarısız oldu.');
      }
    }
  };

  const handleSettingChange = (key: keyof SettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSave(newSettings);
  };

  return (
    <div className="space-y-8">
      
      {/* Bilgi Kutusu */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <Info className="w-8 h-8 text-blue-600 mt-1" />
          <div>
            <h2 className="text-blue-800 font-bold text-2xl mb-3">⚙️ Program Ayarları</h2>
            <p className="text-blue-700 text-lg leading-relaxed">
              Bu sayfadan programın nasıl çalışacağını ayarlayabilirsiniz.<br/>
              Değişiklikler anında kaydedilir ve uygulanır.
            </p>
          </div>
        </div>
      </div>

      {/* 🔔 Bildirim Ayarları */}
      <div className="theme-surface rounded-2xl shadow-xl p-8 border-2 theme-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-500 rounded-xl p-3">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="theme-text text-2xl font-bold">🔔 Bildirimler</h3>
            <p className="theme-text-muted text-lg">Ödeme tarihi yaklaştığında size hatırlatma gönderilir</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Bildirimler Açık/Kapalı */}
          <div className="flex items-center justify-between p-6 theme-bg-secondary rounded-xl border theme-border">
            <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 theme-text-muted" />
              <div>
                <div className="theme-text text-xl font-bold">Bildirimleri Aç/Kapat</div>
                <div className="theme-text-muted text-lg">Ödeme yaklaştığında size bildirim gönderilsin mi?</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('notificationsEnabled', !settings.notificationsEnabled)}
              className={`w-20 h-10 rounded-full transition-all shadow-lg ${
                settings.notificationsEnabled 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}
            >
              <div className={`w-8 h-8 bg-white rounded-full shadow-md transition-all ${
                settings.notificationsEnabled ? 'translate-x-10' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Kaç Gün Önceden */}
          <div className="p-6 theme-bg-secondary rounded-xl border theme-border">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-6 h-6 theme-text-muted" />
              <div>
                <div className="theme-text text-xl font-bold">Kaç Gün Önceden Hatırlat?</div>
                <div className="theme-text-muted text-lg">Ödeme tarihinden kaç gün önce uyarı verilsin?</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[1, 2, 3, 5].map(days => (
                <button
                  key={days}
                  onClick={() => handleSettingChange('reminderDays', days)}
                  className={`p-4 rounded-xl border-2 transition-all text-center font-bold text-lg ${
                    settings.reminderDays === days
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
                  }`}
                >
                  {days === 1 ? '1️⃣ 1 GÜN' : days === 2 ? '2️⃣ 2 GÜN' : days === 3 ? '3️⃣ 3 GÜN' : '5️⃣ 5 GÜN'}
                </button>
              ))}
            </div>
          </div>

          {/* Bildirim Durumu */}
          <div className={`p-6 rounded-xl border-2 ${
            settings.notificationsEnabled 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                settings.notificationsEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className={`font-bold text-lg ${
                  settings.notificationsEnabled ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {settings.notificationsEnabled 
                    ? `✅ Bildirimler AÇIK - ${settings.reminderDays} gün önceden uyarı` 
                    : '❌ Bildirimler KAPALI'
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {settings.notificationsEnabled 
                    ? 'Ödeme tarihi yaklaştığında size hatırlatma göndereceğiz'
                    : 'Hiçbir bildirim almayacaksınız'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎨 Tema Seçimi */}
      <div className="theme-surface rounded-2xl shadow-xl p-8 border-2 theme-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-purple-500 rounded-xl p-3">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="theme-text text-2xl font-bold">🎨 Tema Seçimi</h3>
            <p className="theme-text-muted text-lg">Programın renklerini ve görünümünü değiştirin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {themeOptions.map(theme => (
            <button
              key={theme.value}
              onClick={() => handleSettingChange('theme', theme.value)}
              className={`p-6 rounded-xl border-3 transition-all text-center ${
                settings.theme === theme.value
                  ? 'border-blue-600 bg-blue-50 shadow-xl transform scale-105'
                  : 'theme-border theme-surface hover:shadow-lg hover:scale-102'
              }`}
            >
              <div className="text-4xl mb-3">{theme.emoji}</div>
              <div className={`text-xl font-bold mb-2 ${
                settings.theme === theme.value ? 'text-blue-800' : 'theme-text'
              }`}>
                {theme.label}
              </div>
              <div className={`text-sm ${
                settings.theme === theme.value ? 'text-blue-600' : 'theme-text-muted'
              }`}>
                {theme.description}
              </div>
              {settings.theme === theme.value && (
                <div className="mt-3 text-blue-600 font-medium">
                  ✅ Seçili Tema
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 🔄 Program Güncellemeleri */}
      <div className="theme-surface rounded-2xl shadow-xl p-8 border-2 theme-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-green-500 rounded-xl p-3">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="theme-text text-2xl font-bold">🔄 Program Güncellemeleri</h3>
            <p className="theme-text-muted text-lg">Programı en son sürüme güncelleyin</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Mevcut Sürüm */}
          <div className="flex items-center justify-between p-6 theme-bg-secondary rounded-xl border theme-border">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="theme-text text-xl font-bold">Mevcut Sürüm</div>
                <div className="theme-text-muted text-lg">Şu anda kullandığınız program sürümü</div>
              </div>
            </div>
            <div className="text-2xl font-bold theme-text">
              v{currentVersion}
            </div>
          </div>

          {/* Güncelleme Butonu */}
          <button
            onClick={handleCheckForUpdates}
            disabled={updateStatus === 'checking-for-update' || updateStatus === 'download-progress'}
            className={`w-full p-6 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-4 shadow-lg ${
              updateStatus === 'checking-for-update' || updateStatus === 'download-progress'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : updateStatus === 'update-available'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : updateStatus === 'update-downloaded'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'theme-button hover:shadow-xl'
            }`}
          >
            {updateStatus === 'checking-for-update' && (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                ⏳ KONTROL EDİLİYOR...
              </>
            )}
            {updateStatus === 'download-progress' && (
              <>
                <Download className="w-6 h-6" />
                ⬇️ İNDİRİLİYOR... {updateInfo?.percent ? `%${Math.round(updateInfo.percent)}` : ''}
              </>
            )}
            {updateStatus === 'update-available' && (
              <>
                <Download className="w-6 h-6" />
                ✅ YENİ GÜNCELLEME VAR! İNDİR
              </>
            )}
            {updateStatus === 'update-downloaded' && (
              <>
                <CheckCircle className="w-6 h-6" />
                ✅ GÜNCELLEME HAZIR!
              </>
            )}
            {(updateStatus === 'idle' || updateStatus === 'update-not-available') && (
              <>
                <RefreshCw className="w-6 h-6" />
                🔍 GÜNCELLEMELERİ KONTROL ET
              </>
            )}
            {updateStatus === 'error' && (
              <>
                <AlertCircle className="w-6 h-6" />
                🔍 TEKRAR KONTROL ET
              </>
            )}
          </button>

          {/* Yeniden Başlat Butonu */}
          {updateStatus === 'update-downloaded' && (
            <button
              onClick={handleInstallUpdate}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-4 shadow-lg"
            >
              <RefreshCw className="w-6 h-6" />
              🔄 ŞİMDİ YENİDEN BAŞLAT & GÜNCELLE
            </button>
          )}

          {/* Durum Mesajı */}
          {updateMessage && (
            <div className={`p-6 rounded-xl border-2 text-lg font-medium ${
              updateStatus === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800'
                : updateStatus === 'update-not-available'
                ? 'bg-green-50 border-green-200 text-green-800'
                : updateStatus === 'update-downloaded'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'theme-bg-secondary theme-border theme-text'
            }`}>
              {updateMessage}
            </div>
          )}

          {/* Bilgi */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="text-blue-800 font-bold text-lg mb-2">💡 Güncelleme Hakkında</h4>
                <div className="text-blue-700 space-y-1">
                  <div>✅ <strong>Güvenli:</strong> Tüm verileriniz korunur</div>
                  <div>⚡ <strong>Hızlı:</strong> Sadece değişen dosyalar indirilir</div>
                  <div>🔄 <strong>Otomatik:</strong> Tek tıkla tam güncelleme</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 💾 Veri Yedekleme */}
      <div className="theme-surface rounded-2xl shadow-xl p-8 border-2 theme-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-orange-500 rounded-xl p-3">
            <Save className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="theme-text text-2xl font-bold">💾 Veri Yedekleme</h3>
            <p className="theme-text-muted text-lg">Verilerinizi yedekleyin ve geri yükleyin</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Güvenlik Garantisi */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-green-800 font-bold text-xl mb-2">🛡️ VERİLERİNİZ %100 GÜVENLİ</div>
                <div className="text-green-700 text-lg">
                  Tüm çek ve fatura bilgileriniz sadece bilgisayarınızda saklanır.<br/>
                  Hiçbir veri internete gönderilmez!
                </div>
              </div>
            </div>
          </div>

          {/* Yedekleme Butonları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Yedek Al */}
            <button
              onClick={onExportData}
              className="p-8 theme-button rounded-xl font-bold text-xl transition-all flex flex-col items-center gap-4 shadow-lg hover:shadow-xl"
            >
              <DownloadIcon className="w-12 h-12" />
              <div>
                <div>💾 YEDEK AL</div>
                <div className="text-sm font-normal opacity-80 mt-2">
                  Verilerinizi dosyaya kaydedin
                </div>
              </div>
            </button>

            {/* Yedek Yükle */}
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
                className="w-full h-full p-8 theme-button-secondary rounded-xl font-bold text-xl transition-all flex flex-col items-center gap-4 shadow-lg hover:shadow-xl"
              >
                <Upload className="w-12 h-12" />
                <div>
                  <div>📂 YEDEK YÜKLE</div>
                  <div className="text-sm font-normal opacity-80 mt-2">
                    Eski verilerinizi geri yükleyin
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Yedekleme Önerisi */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <div className="text-yellow-800 font-bold text-lg mb-2">💡 Yedekleme Önerisi</div>
                <div className="text-yellow-700 text-lg space-y-1">
                  <div>📅 <strong>Aylık:</strong> Düzenli olarak yedek alın</div>
                  <div>🔄 <strong>Güncelleme Öncesi:</strong> Ekstra güvenlik için yedekleyin</div>
                  <div>💻 <strong>Yeni Bilgisayar:</strong> Yedek dosyasını yeni cihaza aktarın</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
