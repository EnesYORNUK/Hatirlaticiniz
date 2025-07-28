import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';

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

  const handleSave = () => {
    onSave({
      reminderDays,
      notificationsEnabled,
      autoUpdateEnabled,
      dailyNotificationEnabled,
      dailyNotificationTime,
      lastNotificationCheck: settings.lastNotificationCheck || '',
    });
    alert('Ayarlar kaydedildi!');
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
              Bildirimleri etkinleştir
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 Güncelleme</h2>
        
        <div className="space-y-4">
          {window.electronAPI && (
            <button
              onClick={async () => {
                try {
                  await window.electronAPI.checkForUpdates();
                  alert('Güncellemeler kontrol ediliyor...');
                } catch (error) {
                  alert('Güncelleme kontrolü sırasında hata oluştu.');
                }
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Güncellemeleri Kontrol Et
            </button>
          )}
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
