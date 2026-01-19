import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType } from '../types';
import { 
  Bell, Download, Save, Upload, Moon, Sun, 
  Smartphone, Monitor, Volume2, Shield, Database, 
  Info, ChevronRight, MessageCircle, Clock, CheckCircle, XCircle 
} from 'lucide-react';

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
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data'>('general');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(version => {
        setCurrentVersion(version);
      }).catch(() => {
        setCurrentVersion('1.0.0');
      });
    }
  }, []);

  const handleSettingChange = (key: keyof SettingsType, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
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
    } else {
      alert('Bu özellik sadece masaüstü uygulamasında çalışır.');
    }
  };

  const testTelegramBot = async () => {
    if (!localSettings.telegramBotToken || !localSettings.telegramChatId) {
      alert('Önce Telegram Bot Token ve Chat ID\'yi giriniz');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${localSettings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: localSettings.telegramChatId,
          text: '🎉 Hatırlatıcınız: Test Mesajı\n\nBot bağlantısı başarılı! Bildirimleri buradan alacaksınız.',
        }),
      });

      if (response.ok) {
        alert('✅ Başarılı! Telegram mesajınızı kontrol edin.');
      } else {
        alert('❌ Başarısız. Token ve Chat ID\'yi kontrol edin.');
      }
    } catch (error) {
      alert('❌ Bağlantı hatası: ' + error);
    }
  };

  const tabs = [
    { id: 'general', label: 'Genel', icon: Monitor },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'data', label: 'Veri ve Sistem', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md py-4 border-b theme-border">
        <div>
          <h1 className="text-2xl font-bold theme-text">Ayarlar</h1>
          <p className="theme-text-muted text-sm">Uygulama tercihlerinizi yönetin</p>
        </div>
        <button
          onClick={() => onSave(localSettings)}
          className="theme-button px-6 py-2.5 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Değişiklikleri Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-3 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'theme-primary text-white shadow-md'
                  : 'theme-text-muted hover:theme-bg-secondary hover:theme-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t theme-border px-4">
            <p className="text-xs theme-text-muted">Sürüm {currentVersion || '1.0.0'}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-9 space-y-6">
          
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className="theme-surface p-6 rounded-2xl border theme-border shadow-sm">
                <h2 className="text-lg font-semibold theme-text mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  Görünüm
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSettingChange('theme', 'light')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                      localSettings.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'theme-border theme-bg-secondary hover:border-blue-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <Sun className="w-6 h-6 text-orange-500" />
                    </div>
                    <span className="font-medium theme-text">Aydınlık Mod</span>
                  </button>

                  <button
                    onClick={() => handleSettingChange('theme', 'dark')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                      localSettings.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'theme-border theme-bg-secondary hover:border-blue-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 shadow-sm flex items-center justify-center">
                      <Moon className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="font-medium theme-text">Karanlık Mod</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Main Toggle */}
              <div className="theme-surface p-6 rounded-2xl border theme-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold theme-text">Bildirimler</h2>
                      <p className="theme-text-muted text-sm">Tüm hatırlatmaları buradan yönetin</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.notificationsEnabled}
                      onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {localSettings.notificationsEnabled && (
                  <div className="space-y-6 pl-2">
                    {/* Reminder Days */}
                    <div className="flex items-center justify-between py-3 border-b theme-border">
                      <div>
                        <span className="theme-text font-medium block">Hatırlatma Süresi</span>
                        <span className="theme-text-muted text-xs">Son ödeme tarihinden kaç gün önce?</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={localSettings.reminderDays}
                          onChange={(e) => handleSettingChange('reminderDays', parseInt(e.target.value) || 1)}
                          className="theme-input w-16 text-center"
                        />
                        <span className="theme-text text-sm">gün</span>
                      </div>
                    </div>

                    {/* Daily Summary */}
                    <div className="flex items-center justify-between py-3 border-b theme-border">
                      <div>
                        <span className="theme-text font-medium block">Günlük Özet</span>
                        <span className="theme-text-muted text-xs">Her gün belirlenen saatte özet bildirimi</span>
                      </div>
                      <div className="flex items-center gap-4">
                         {localSettings.dailyNotificationEnabled && (
                          <input
                            type="time"
                            value={localSettings.dailyNotificationTime}
                            onChange={(e) => handleSettingChange('dailyNotificationTime', e.target.value)}
                            className="theme-input text-sm"
                          />
                        )}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.dailyNotificationEnabled}
                            onChange={(e) => handleSettingChange('dailyNotificationEnabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Test Button */}
                    <div className="pt-2">
                      <button
                        onClick={testNotification}
                        className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        Bildirimleri test et
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Telegram Bot */}
              <div className="theme-surface p-6 rounded-2xl border theme-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold theme-text flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Telegram Botu
                  </h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.telegramBotEnabled}
                      onChange={(e) => handleSettingChange('telegramBotEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {localSettings.telegramBotEnabled && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="theme-text text-sm font-medium block mb-1">Bot Token</label>
                      <input
                        type="password"
                        value={localSettings.telegramBotToken || ''}
                        onChange={(e) => handleSettingChange('telegramBotToken', e.target.value)}
                        placeholder="123456:ABC-DEF..."
                        className="theme-input w-full"
                      />
                    </div>
                    <div>
                      <label className="theme-text text-sm font-medium block mb-1">Chat ID</label>
                      <input
                        type="text"
                        value={localSettings.telegramChatId || ''}
                        onChange={(e) => handleSettingChange('telegramChatId', e.target.value)}
                        placeholder="12345678"
                        className="theme-input w-full"
                      />
                    </div>
                    <button
                      onClick={testTelegramBot}
                      className="theme-button-secondary w-full justify-center text-sm"
                    >
                      Bağlantıyı Test Et
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Settings */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <div className="theme-surface p-6 rounded-2xl border theme-border shadow-sm">
                <h2 className="text-lg font-semibold theme-text mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  Veri Yönetimi
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl theme-bg-secondary border theme-border flex items-center justify-between">
                    <div>
                      <h3 className="font-medium theme-text">Yedekle</h3>
                      <p className="text-sm theme-text-muted">Tüm verilerinizi dışa aktarın</p>
                    </div>
                    <button
                      onClick={onExportData}
                      className="theme-button-secondary flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </button>
                  </div>

                  <div className="p-4 rounded-xl theme-bg-secondary border theme-border flex items-center justify-between">
                    <div>
                      <h3 className="font-medium theme-text">Geri Yükle</h3>
                      <p className="text-sm theme-text-muted">Yedek dosyasından geri yükleyin</p>
                    </div>
                    <label className="theme-button-secondary flex items-center gap-2 text-sm cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Yükle
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onImportData}
                        accept=".json"
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}