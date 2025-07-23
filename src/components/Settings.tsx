import React, { useState, useEffect } from 'react';
import { Settings as SettingsType } from '../types';
import { Bell, Save, Download, Upload, RefreshCw, CheckCircle } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
}

export default function Settings({ settings, onSave, onExportData, onImportData }: SettingsProps) {
  const [formData, setFormData] = useState<SettingsType>({
    ...settings,
    autoUpdateEnabled: settings.autoUpdateEnabled ?? true, // Default true
  });
  const [savedMessage, setSavedMessage] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | 'update-available' | 'update-downloaded' | 'download-progress'>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      const handleUpdateStatus = (status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | 'update-available' | 'update-downloaded' | 'download-progress', info: any) => {
        setUpdateStatus(status);
        switch (status) {
          case 'update-available':
          case 'update-downloaded':
            setUpdateInfo(info);
            break;
          case 'download-progress':
            setDownloadProgress(info.percent);
            break;
          case 'error':
            setUpdateInfo({ message: info });
            break;
          default:
            // Diğer durumlar için bir şey yapmaya gerek yok
            break;
        }
      };

      window.electronAPI.onUpdateStatus(handleUpdateStatus);

      return () => {
        // Eğer preload.cjs içinde removeUpdateStatusListener gibi bir fonksiyon tanımladıysanız
        // window.electronAPI.removeUpdateStatusListener(handleUpdateStatus);
      };
    }
  }, [isElectron]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImportData(data);
      } catch (error) {
        alert('Geçersiz dosya formatı!');
      }
    };
    reader.readAsText(file);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setFormData(prev => ({ ...prev, notificationsEnabled: true }));
      }
    }
  };

  const handleCheckForUpdates = async () => {
    if (isElectron && window.electronAPI) {
      setUpdateStatus('checking');
      try {
        await window.electronAPI.checkForUpdates();
      } catch (error: any) {
        setUpdateStatus('error');
        setUpdateInfo({ message: error.message || 'Güncelleme kontrol edilirken bir hata oluştu.' });
      }
    }
  };

  const handleDownloadUpdate = async () => {
    if (isElectron && window.electronAPI) {
      setUpdateStatus('downloading');
      try {
        await window.electronAPI.downloadUpdate();
      } catch (error: any) {
        setUpdateStatus('error');
        setUpdateInfo({ message: error.message || 'Güncelleme indirilirken bir hata oluştu.' });
      }
    }
  };

  const handleInstallUpdate = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.installUpdate();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ayarlar</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bildirim Ayarları */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bildirim Ayarları</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Masaüstü Bildirimleri
                    </label>
                    <p className="text-sm text-gray-500">
                      Çek ödeme tarihleri için bildirim al
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!formData.notificationsEnabled && typeof window !== 'undefined' && !window.electronAPI && (
                    <button
                      type="button"
                      onClick={requestNotificationPermission}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      İzin Ver
                    </button>
                  )}
                  <input
                    type="checkbox"
                    checked={formData.notificationsEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hatırlatma Süresi (Gün)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.reminderDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderDays: Number(e.target.value) }))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    gün önceden hatırlat
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Çek ödeme tarihinden kaç gün önce bildirim alacağınızı belirler
                </p>
              </div>

              {isElectron && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="h-5 w-5 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Otomatik Güncelleme
                      </label>
                      <p className="text-sm text-gray-500">
                        Yeni sürümler otomatik olarak kontrol edilsin ve bildirim alın
                      </p>
                    </div>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={formData.autoUpdateEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoUpdateEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Veri Yönetimi */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Veri Yönetimi</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onExportData}
                  className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Verileri Dışa Aktar</span>
                </button>
                
                <label className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Verileri İçe Aktar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-sm text-gray-500">
                Çek verilerinizi yedeklemek veya başka bir cihaza aktarmak için kullanın
              </p>
            </div>
          </div>

          {/* Uygulama Güncelleme */}
          {isElectron && (
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uygulama Güncelleme</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Güncellemeleri Kontrol Et</span>
                </button>

                {updateStatus === 'checking' && (
                  <p className="text-sm text-blue-600">Güncelleme aranıyor...</p>
                )}
                {updateStatus === 'update-available' && updateInfo && (
                  <div className="text-sm text-green-600">
                    <p>Yeni güncelleme mevcut: v{updateInfo.version}</p>
                    <button
                      type="button"
                      onClick={handleDownloadUpdate}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Güncellemeyi İndir
                    </button>
                  </div>
                )}
                {updateStatus === 'downloading' && (
                  <div className="text-sm text-blue-600">
                    <p>Güncelleme indiriliyor: %{downloadProgress.toFixed(2)}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                {updateStatus === 'update-downloaded' && (
                  <div className="text-sm text-green-600 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <p>Güncelleme indirildi! Uygulamayı yeniden başlatın.</p>
                    <button
                      type="button"
                      onClick={handleInstallUpdate}
                      className="ml-auto px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Yeniden Başlat ve Kur
                    </button>
                  </div>
                )}
                {updateStatus === 'not-available' && (
                  <p className="text-sm text-gray-600">En son sürümü kullanıyorsunuz.</p>
                )}
                {updateStatus === 'error' && updateInfo && (
                  <p className="text-sm text-red-600">Hata: {updateInfo.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Kaydet Butonu */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Ayarları Kaydet</span>
            </button>
          </div>

          {savedMessage && (
            <div className="text-center text-green-600 font-medium">
              Ayarlar başarıyla kaydedildi!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
