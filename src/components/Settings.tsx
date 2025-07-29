import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType, ThemeType } from '../types';
import { Bell, Download, Save, Upload, CheckCircle, RefreshCw, Palette, Info } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      showNotification: (title: string, body: string) => Promise<void>;
      checkForUpdates: () => Promise<{success: boolean, message: string}>;
      getVersion: () => Promise<string>;
      saveAppData: (key: string, data: any) => Promise<void>;
      loadAppData: (key: string) => Promise<any>;
    };
  }
}

const themeOptions: { value: ThemeType; label: string; color: string }[] = [
  { value: 'light', label: 'Açık', color: '#ffffff' },
  { value: 'dark', label: 'Koyu', color: '#0f172a' },
  { value: 'blue', label: 'Mavi', color: '#1e40af' },
  { value: 'green', label: 'Yeşil', color: '#15803d' },
  { value: 'orange', label: 'Turuncu', color: '#c2410c' },
  { value: 'purple', label: 'Mor', color: '#7c3aed' },
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
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(version => {
        setCurrentVersion(version);
      }).catch(() => {
        setCurrentVersion('Bilinmiyor');
      });
    }
  }, []);

  const handleSave = () => {
    onSave(settings);
  };

  const handleThemeChange = (theme: ThemeType) => {
    onSave({ ...settings, theme });
  };

  const handleNotificationChange = (enabled: boolean) => {
    onSave({ ...settings, notificationsEnabled: enabled });
  };

  const handleCheckForUpdates = async () => {
    if (window.electronAPI?.checkForUpdates) {
      try {
        setUpdateStatus('checking');
        const result = await window.electronAPI.checkForUpdates();
        setUpdateStatus(result.success ? 'success' : 'error');
      } catch (error) {
        setUpdateStatus('error');
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
              onClick={() => handleThemeChange(option.value)}
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
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Masaüstü Bildirimleri</div>
              <div className="theme-text-muted text-sm">Ödeme tarihleri yaklaştığında bildirim al</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleNotificationChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {settings.notificationsEnabled && (
            <div className="pl-4 border-l-2 border-blue-200">
              <button
                onClick={testNotification}
                className="theme-button-secondary px-4 py-2 text-sm"
              >
                Bildirim Testi
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
          <div className="flex items-center justify-between">
            <div>
              <div className="theme-text font-medium">Mevcut Sürüm</div>
              <div className="theme-text-muted text-sm">v{currentVersion}</div>
            </div>
            <button
              onClick={handleCheckForUpdates}
              disabled={updateStatus === 'checking'}
              className={`theme-button flex items-center gap-2 px-4 py-2 ${
                updateStatus === 'checking' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
              {updateStatus === 'checking' ? 'Kontrol Ediliyor...' : 'Güncelleme Kontrol Et'}
            </button>
          </div>
          
          {updateStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Güncelleme kontrolü tamamlandı</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
