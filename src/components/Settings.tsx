import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType, ThemeType } from '../types';
import { Bell, Download, Shield, Clock, MessageCircle, Bot, Palette, Eye, Moon, Sun, Circle, Save, Upload, Download as DownloadIcon, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Loader } from 'lucide-react';

// Global type declaration for window.electronAPI
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

// 🎨 Tema seçenekleri
const themeOptions: { value: ThemeType; label: string; emoji: string; description: string }[] = [
  { value: 'light', label: 'Açık Tema', emoji: '🌅', description: 'Klasik beyaz tema' },
  { value: 'dark', label: 'Koyu Tema', emoji: '🌙', description: 'Göz yormayan karanlık tema' },
  { value: 'blue', label: 'Mavi Tema', emoji: '🔵', description: 'Profesyonel mavi tonları' },
  { value: 'green', label: 'Yeşil Tema', emoji: '🟢', description: 'Doğal yeşil renkleri' },
  { value: 'orange', label: 'Turuncu Tema', emoji: '🟠', description: 'Enerjik turuncu tonları' },
  { value: 'purple', label: 'Mor Tema', emoji: '🟣', description: 'Kreatif mor renkleri' },
  { value: 'gray', label: 'Gri Tema', emoji: '⚫', description: 'Minimal gri tonları' },
  { value: 'red', label: 'Kırmızı Tema', emoji: '🔴', description: 'Cesur kırmızı renkleri' },
  { value: 'teal', label: 'Turkuaz Tema', emoji: '🟦', description: 'Sakin turkuaz tonları' },
  { value: 'pink', label: 'Pembe Tema', emoji: '🌸', description: 'Sevimli pembe renkleri' },
];

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Settings({ settings, onSave, onExportData, onImportData }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update states
  const [updateStatus, setUpdateStatus] = useState<string>('idle');
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    // Get current version
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(version => {
        setCurrentVersion(version);
      }).catch(err => {
        console.error('Version alınamadı:', err);
        setCurrentVersion('Bilinmiyor');
      });
    }

    // Listen for update status
    if (window.electronAPI?.onUpdateStatus) {
      const handleUpdateStatus = (status: string, info?: any) => {
        console.log('📨 Settings: Update status alındı:', status, info);
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
            setUpdateMessage('Uygulama güncel, yeni güncelleme yok.');
            break;
          case 'download-progress':
            const percent = Math.round(info?.percent || 0);
            setUpdateMessage(`Güncelleme indiriliyor... %${percent}`);
            break;
          case 'update-downloaded':
            setUpdateMessage('Güncelleme indirildi! Yeniden başlatma için hazır.');
            break;
          case 'error':
            setUpdateMessage(`Güncelleme hatası: ${info?.message || 'Bilinmeyen hata'}`);
            break;
          default:
            console.warn('🤔 Settings: Bilinmeyen update status:', status);
            setUpdateMessage(`Durum: ${status}`);
        }
      };

      console.log('👂 Settings: Update status listener kuruldu');
      window.electronAPI.onUpdateStatus(handleUpdateStatus);

      return () => {
        console.log('🔇 Settings: Update status listener temizlendi');
        if (window.electronAPI?.removeUpdateStatusListener) {
          window.electronAPI.removeUpdateStatusListener();
        }
      };
    } else {
      console.warn('⚠️ Settings: electronAPI.onUpdateStatus mevcut değil');
    }
  }, []);

  const handleCheckForUpdates = async () => {
    console.log('🔍 Settings: Güncelleme kontrolü başlatılıyor...');
    
    if (window.electronAPI?.checkForUpdates) {
      try {
        setUpdateStatus('checking-for-update');
        setUpdateMessage('Güncellemeler kontrol ediliyor...');
        
        console.log('📡 Settings: electronAPI.checkForUpdates çağrılıyor...');
        const result = await window.electronAPI.checkForUpdates();
        console.log('✅ Settings: electronAPI.checkForUpdates sonucu:', result);
        
        if (result.success) {
          console.log('✅ Settings: Güncelleme kontrolü başarılı');
          // autoUpdater event'leri status'u handle edecek
        } else {
          console.error('❌ Settings: Update check başarısız:', result.message);
          setUpdateStatus('error');
          setUpdateMessage(`Güncelleme kontrolü başarısız: ${result.message}`);
        }
        
      } catch (error: any) {
        console.error('❌ Settings: Update check kritik hatası:', error);
        setUpdateStatus('error');
        setUpdateMessage(`Güncelleme kontrolü hatası: ${error.message}`);
      }
    } else {
      console.error('❌ Settings: electronAPI.checkForUpdates mevcut değil');
      setUpdateStatus('error');
      setUpdateMessage('Güncelleme sistemi kullanılamıyor. Desktop uygulamasında deneyin.');
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI?.installUpdate) {
      try {
        await window.electronAPI.installUpdate();
      } catch (error) {
        console.error('Update install failed:', error);
        setUpdateMessage('Güncelleme kurulumu başarısız oldu.');
      }
    }
  };

  const testTelegramBot = async () => {
    if (!settings.telegramBotToken) {
      alert('❌ Önce Bot Token girin!');
      return;
    }

    try {
      // 1. Bot token'ını doğrula
      console.log('🤖 Bot token doğrulanıyor...');
      const getMeResponse = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getMe`);
      const getMeData = await getMeResponse.json();
      
      if (!getMeData.ok) {
        alert(`❌ Bot token geçersiz: ${getMeData.description}`);
        return;
      }
      
      console.log('✅ Bot token geçerli:', getMeData.result.username);

             // 2. Webhook'ları temizle (eğer varsa)
       console.log('🧹 Webhook\'lar temizleniyor...');
      const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getWebhookInfo`);
      const webhookInfo = await webhookInfoResponse.json();
      
      if (webhookInfo.ok && webhookInfo.result.url) {
        console.log('🗑️ Mevcut webhook temizleniyor...');
        await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/deleteWebhook`);
      }

      // 3. Chat ID'yi kontrol et veya bul
      if (!settings.telegramChatId) {
        console.log('🔍 Chat ID aranıyor...');
        
        // getUpdates ile mesajları kontrol et
        const updatesResponse = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getUpdates?limit=100`);
        const updatesData = await updatesResponse.json();
        
        if (updatesData.ok && updatesData.result.length > 0) {
          // Tüm chat ID'leri topla ve en son mesajı alan chat ID'yi seç
          const chatIds = [...new Set(updatesData.result.map((update: any) => update.message?.chat?.id).filter(Boolean))];
          
          if (chatIds.length > 0) {
            const latestChatId = chatIds[chatIds.length - 1]; // En son mesaj
            console.log('📱 Chat ID bulundu:', latestChatId);
            
            // Chat ID'yi kaydet
            onSave({ ...settings, telegramChatId: latestChatId.toString() });
            
            alert(`✅ Chat ID otomatik bulundu!\n\nChat ID: ${latestChatId}\n\nŞimdi test mesajı gönderiliyor...`);
            
            // Test mesajı gönder
            const testResponse = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: latestChatId,
                text: `🎉 Hatırlatıcınım Bot Testi Başarılı!\n\n✅ Bot bağlantısı kuruldu\n📱 Chat ID: ${latestChatId}\n🤖 Bot: @${getMeData.result.username}\n\nArtık komutları kullanabilirsiniz:\n/start - Başlangıç\n/bugun - Bugün ödenecekler\n/yakin - 7 gün içindekiler\n/tumu - Tüm aktif ödemeler`
              })
            });
            
            const testData = await testResponse.json();
            if (testData.ok) {
              alert('🎉 Test mesajı başarıyla gönderildi!\n\nTelegram\'da kontrol edin.');
            } else {
              alert(`❌ Test mesajı gönderilemedi: ${testData.description}`);
            }
            return;
          }
        }
        
        // Chat ID bulunamadı
        alert(`❓ Chat ID bulunamadı!\n\n📱 Manuel olarak bulmak için:\n\n1️⃣ @userinfobot'a mesaj yazın\n2️⃣ Veya @chatid_echo_bot'u kullanın\n3️⃣ Aldığınız Chat ID'yi aşağıya girin\n\n💡 Veya bot'unuza herhangi bir mesaj yazıp tekrar test edin.`);
        return;
      }

      // 4. Chat ID mevcut, test mesajı gönder
      console.log('📤 Test mesajı gönderiliyor...');
      const testResponse = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: `🎉 Hatırlatıcınım Bot Testi Başarılı!\n\n✅ Bot bağlantısı kuruldu\n📱 Chat ID: ${settings.telegramChatId}\n🤖 Bot: @${getMeData.result.username}\n\nKomutları kullanabilirsiniz:\n/start - Başlangıç\n/bugun - Bugün ödenecekler\n/yakin - 7 gün içindekiler\n/tumu - Tüm aktif ödemeler`
        })
      });

      const testData = await testResponse.json();
      
      if (testData.ok) {
        alert('🎉 Test başarılı!\n\nTelegram\'da test mesajı kontrol edin.');
      } else {
        alert(`❌ Test mesajı gönderilemedi:\n\n${testData.description}\n\nChat ID'nin doğru olduğundan emin olun.`);
      }

    } catch (error) {
      console.error('❌ Telegram bot test hatası:', error);
      alert(`❌ Bağlantı hatası:\n\n${error}\n\nİnternet bağlantınızı kontrol edin.`);
    }
  };

  return (
    <div className="theme-bg min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* 🎨 Tema Ayarları Bölümü */}
        <div className="theme-surface rounded-lg shadow-md p-6 theme-border border">
          <div className="flex items-center gap-3 mb-6">
            <div className="theme-primary rounded-full p-2">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="theme-text text-lg font-semibold">🎨 Tema Ayarları</h3>
              <p className="theme-text-muted text-sm">Uygulamanın görünümünü kişiselleştirin</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tema Seçici */}
            <div>
              <label className="theme-text block text-sm font-medium mb-3">
                Tema Seçin
              </label>
              <div className="relative">
                <select
                  value={settings.theme}
                  onChange={(e) => onSave({ ...settings, theme: e.target.value as ThemeType })}
                  className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10"
                >
                  {themeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label} - {option.description}
                    </option>
                  ))}
                </select>
                <Eye className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 theme-text-muted pointer-events-none" />
              </div>
            </div>

            {/* Tema Önizleme Kartları */}
            <div className="mt-6">
              <label className="theme-text block text-sm font-medium mb-3">
                Tema Önizlemesi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {themeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onSave({ ...settings, theme: option.value })}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-center hover:scale-105 ${
                      settings.theme === option.value
                        ? 'theme-primary border-current shadow-lg'
                        : 'theme-surface theme-border hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className={`text-xs font-medium ${
                      settings.theme === option.value ? 'text-white' : 'theme-text'
                    }`}>
                      {option.label.replace(' Tema', '')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mevcut Tema Info */}
            <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {themeOptions.find(t => t.value === settings.theme)?.emoji}
                </div>
                <div>
                  <div className="theme-text font-medium">
                    Aktif Tema: {themeOptions.find(t => t.value === settings.theme)?.label}
                  </div>
                  <div className="theme-text-muted text-sm">
                    {themeOptions.find(t => t.value === settings.theme)?.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Tema İpuçları */}
            <div className="theme-info bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-blue-800 font-medium text-sm mb-1">💡 Tema İpuçları</div>
                  <div className="text-blue-700 text-sm space-y-1">
                    <div>• <strong>Koyu Tema:</strong> Gece kullanımı için ideal</div>
                    <div>• <strong>Mavi/Gri:</strong> Profesyonel ortamlar için</div>
                    <div>• <strong>Yeşil/Turkuaz:</strong> Göz yorgunluğunu azaltır</div>
                    <div>• <strong>Renkli Temalar:</strong> Kişisel kullanım için eğlenceli</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📢 Bildirim Ayarları */}
        <div className="theme-surface rounded-lg shadow-md p-6 theme-border border">
          <div className="flex items-center gap-3 mb-6">
            <div className="theme-primary rounded-full p-2">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="theme-text text-lg font-semibold">📢 Bildirim Ayarları</h3>
              <p className="theme-text-muted text-sm">Hatırlatma ve bildirim tercihlerinizi yönetin</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Hatırlatma Günü */}
            <div>
              <label className="theme-text block text-sm font-medium mb-2">
                Hatırlatma Günü (Gün Önceden)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.reminderDays}
                onChange={(e) => onSave({ ...settings, reminderDays: parseInt(e.target.value) || 1 })}
                className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="theme-text-muted text-sm mt-1">
                Ödeme tarihinden {settings.reminderDays} gün önce hatırlatılacaksınız
              </p>
            </div>

            {/* Temel Bildirimler */}
            <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg border theme-border">
              <div>
                <div className="theme-text font-medium">Hatırlatma Bildirimleri</div>
                <div className="theme-text-muted text-sm">Ödeme tarihi yaklaştığında bildirim al</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => onSave({ ...settings, notificationsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Günlük Bildirimler */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg border theme-border">
                <div>
                  <div className="theme-text font-medium">Günlük Bildirimler</div>
                  <div className="theme-text-muted text-sm">Her gün belirli saatte ödeme kontrolü</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dailyNotificationEnabled}
                    onChange={(e) => onSave({ ...settings, dailyNotificationEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.dailyNotificationEnabled && (
                <div>
                  <label className="theme-text block text-sm font-medium mb-2">
                    Günlük Bildirim Saati
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted w-4 h-4" />
                    <input
                      type="time"
                      value={settings.dailyNotificationTime}
                      onChange={(e) => onSave({ ...settings, dailyNotificationTime: e.target.value })}
                      className="theme-input w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="theme-text-muted text-sm mt-1">
                    Her gün saat {settings.dailyNotificationTime} de o gün ödenecek çek/faturaları kontrol et
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🤖 Telegram Bot Ayarları */}
        <div className="theme-surface rounded-lg shadow-md p-6 theme-border border">
          <div className="flex items-center gap-3 mb-6">
            <div className="theme-primary rounded-full p-2">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="theme-text text-lg font-semibold">🤖 Telegram Bot</h3>
              <p className="theme-text-muted text-sm">Telefonunuzdan çek/fatura takibi yapın</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Bot Enable/Disable */}
            <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg border theme-border">
              <div>
                <div className="theme-text font-medium">Telegram Bot</div>
                <div className="theme-text-muted text-sm">Mobil bildirimler ve komutlar</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.telegramBotEnabled}
                  onChange={(e) => onSave({ ...settings, telegramBotEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.telegramBotEnabled && (
              <div className="space-y-4">
                {/* Bot Token */}
                <div>
                  <label className="theme-text block text-sm font-medium mb-2">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    placeholder="Bot Token'ını buraya girin..."
                    value={settings.telegramBotToken}
                    onChange={(e) => onSave({ ...settings, telegramBotToken: e.target.value })}
                    className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="theme-text-muted text-sm mt-1">
                    @BotFather'dan aldığınız token
                  </p>
                </div>

                {/* Chat ID */}
                <div>
                  <label className="theme-text block text-sm font-medium mb-2">
                    Chat ID (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Chat ID otomatik bulunur..."
                    value={settings.telegramChatId}
                    onChange={(e) => onSave({ ...settings, telegramChatId: e.target.value })}
                    className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="theme-text-muted text-sm mt-1">
                    Test Et butonuyla otomatik bulunur
                  </p>
                </div>

                {/* Test Button */}
                <button
                  onClick={testTelegramBot}
                  className="theme-button w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {settings.telegramChatId ? 'Test Et' : 'Chat ID Bul & Test Et'}
                </button>

                {/* Setup Instructions */}
                <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
                  <h4 className="theme-text font-medium mb-3">📋 Kurulum Adımları:</h4>
                  <div className="theme-text-muted text-sm space-y-2">
                    <div>1. Telegram'da <strong>@BotFather</strong>'a git</div>
                    <div>2. <code className="bg-gray-100 px-1 rounded">/newbot</code> komutunu kullan</div>
                    <div>3. Bot adı ve kullanıcı adı ver</div>
                    <div>4. Aldığın <strong>Token</strong>'ı yukarı yapıştır</div>
                    <div>5. Bot'unuza herhangi bir mesaj yaz</div>
                    <div>6. <strong>"Test Et"</strong> butonuna bas</div>
                    <div>7. ✅ Kurulum tamamlandı!</div>
                  </div>
                </div>

                {/* Commands List */}
                <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
                  <h4 className="theme-text font-medium mb-3">🤖 Kullanılabilir Komutlar:</h4>
                  <div className="theme-text-muted text-sm space-y-1">
                    <div><code className="bg-gray-100 px-1 rounded">/start</code> - Bot'u başlat</div>
                    <div><code className="bg-gray-100 px-1 rounded">/bugun</code> - Bugün ödenecekler</div>
                    <div><code className="bg-gray-100 px-1 rounded">/yakin</code> - 7 gün içindekiler</div>
                    <div><code className="bg-gray-100 px-1 rounded">/tumu</code> - Tüm aktif ödemeler</div>
                    <div><code className="bg-gray-100 px-1 rounded">/gecmis</code> - Vadesi geçenler</div>
                    <div><code className="bg-gray-100 px-1 rounded">/istatistik</code> - Genel özet</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔄 Güncelleme Ayarları */}
        <div className="theme-surface rounded-lg shadow-md p-6 theme-border border">
          <div className="flex items-center gap-3 mb-6">
            <div className="theme-primary rounded-full p-2">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="theme-text text-lg font-semibold">🔄 Uygulama Güncellemeleri</h3>
              <p className="theme-text-muted text-sm">Otomatik güncelleme ve sürüm yönetimi</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Current Version */}
            {currentVersion && (
              <div className="flex items-center gap-3">
                <span className="theme-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  v{currentVersion}
                </span>
                <span className="theme-text-muted text-sm">Mevcut Sürüm</span>
              </div>
            )}

            {/* Data Safety Guarantee */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-green-800 font-medium text-sm mb-1">🛡️ Verileriniz Güvende</div>
                  <div className="text-green-700 text-sm">
                    Tüm çek/fatura bilgileriniz güncelleme sırasında korunur ve kaybolmaz.
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Update Toggle */}
            <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg border theme-border">
              <div>
                <div className="theme-text font-medium">Otomatik Güncelleme</div>
                <div className="theme-text-muted text-sm">Yeni sürümler otomatik kontrol edilsin</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoUpdateEnabled}
                  onChange={(e) => onSave({ ...settings, autoUpdateEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Update Status and Controls */}
            <div className="space-y-4">
              {/* Main Update Button */}
              <button
                onClick={handleCheckForUpdates}
                disabled={updateStatus === 'checking-for-update' || updateStatus === 'download-progress'}
                className={`w-full px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-3 ${
                  updateStatus === 'checking-for-update' || updateStatus === 'download-progress'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : updateStatus === 'update-available'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : updateStatus === 'update-downloaded'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'theme-button'
                }`}
              >
                {updateStatus === 'checking-for-update' && (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    ⏳ Kontrol Ediliyor...
                  </>
                )}
                {updateStatus === 'download-progress' && (
                  <>
                    <Download className="w-5 h-5" />
                    ⬇️ İndiriliyor... {updateInfo?.percent ? `%${Math.round(updateInfo.percent)}` : ''}
                  </>
                )}
                {updateStatus === 'update-available' && (
                  <>
                    <Download className="w-5 h-5" />
                    ✅ Güncelleme Mevcut! İndir
                  </>
                )}
                {updateStatus === 'update-downloaded' && (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ✅ Güncelleme Hazır!
                  </>
                )}
                {(updateStatus === 'idle' || updateStatus === 'update-not-available') && (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    🔍 Güncellemeleri Kontrol Et
                  </>
                )}
                {updateStatus === 'error' && (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    🔍 Tekrar Kontrol Et
                  </>
                )}
              </button>

              {/* Install Update Button (when downloaded) */}
              {updateStatus === 'update-downloaded' && (
                <button
                  onClick={handleInstallUpdate}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  🔄 Şimdi Yeniden Başlat & Güncelle
                </button>
              )}

              {/* Manual GitHub Check (only on error) */}
              {updateStatus === 'error' && (
                <a
                  href="https://github.com/EnesYORNUK/Hatirlaticiniz/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-100 hover:bg-gray-200 theme-text px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 border theme-border"
                >
                  <ExternalLink className="w-5 h-5" />
                  🌐 GitHub'da Manuel Kontrol Et
                </a>
              )}

              {/* Update Status Message */}
              {updateMessage && (
                <div className={`p-4 rounded-lg border text-sm ${
                  updateStatus === 'error' 
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : updateStatus === 'update-not-available'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : updateStatus === 'update-downloaded'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'theme-bg-secondary theme-border theme-text'
                }`}>
                  <div className="flex items-center gap-2">
                    {updateStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    {updateStatus === 'update-not-available' && <CheckCircle className="w-4 h-4" />}
                    {updateStatus === 'update-downloaded' && <CheckCircle className="w-4 h-4" />}
                    {updateStatus === 'checking-for-update' && <Loader className="w-4 h-4 animate-spin" />}
                    <span>{updateMessage}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Debug Panel */}
            <details className="theme-bg-secondary rounded-lg p-4 border theme-border">
              <summary className="theme-text font-medium cursor-pointer">🔧 Debug Bilgileri</summary>
              <div className="theme-text-muted text-sm mt-3 space-y-1">
                <div>Electron API: {window.electronAPI ? '✅ Mevcut' : '❌ Yok'}</div>
                <div>Update Handler: {window.electronAPI?.onUpdateStatus ? '✅ Aktif' : '❌ Pasif'}</div>
                <div>Current Version: {currentVersion || 'Bilinmiyor'}</div>
                <div>Update Status: {updateStatus}</div>
                <div>Last Message: {updateMessage || 'Yok'}</div>
              </div>
            </details>

            {/* How It Works */}
            <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
              <h4 className="theme-text font-medium mb-3">🔄 Nasıl Çalışır?</h4>
              <div className="theme-text-muted text-sm space-y-2">
                <div><strong>1. Kontrol:</strong> GitHub'daki yeni sürümler kontrol edilir</div>
                <div><strong>2. İndirme:</strong> Güncelleme arka planda indirilir</div>
                <div><strong>3. Kurulum:</strong> Uygulama yeniden başlatılır</div>
                <div><strong>4. Veri Korunması:</strong> Tüm bilgileriniz otomatik korunur</div>
              </div>
            </div>

            {/* Update Process */}
            <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
              <h4 className="theme-text font-medium mb-3">📋 Güncelleme Süreci</h4>
              <div className="theme-text-muted text-sm space-y-2">
                <div>✅ <strong>Güvenli:</strong> Tüm verileriniz korunur</div>
                <div>⚡ <strong>Hızlı:</strong> Sadece değişen dosyalar indirilir</div>
                <div>🔄 <strong>Otomatik:</strong> Tek tıkla tam güncelleme</div>
                <div>💾 <strong>Backup:</strong> Eski sürüm otomatik saklanır</div>
              </div>
            </div>
          </div>
        </div>

        {/* 💾 Veri Yönetimi */}
        <div className="theme-surface rounded-lg shadow-md p-6 theme-border border">
          <div className="flex items-center gap-3 mb-6">
            <div className="theme-primary rounded-full p-2">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="theme-text text-lg font-semibold">💾 Veri Yönetimi</h3>
              <p className="theme-text-muted text-sm">Verilerinizi yedekleyin ve geri yükleyin</p>
            </div>
          </div>

          {/* Veri Korunma Garantisi */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-green-800 font-bold text-lg mb-2">🛡️ VERİLERİNİZ %100 GÜVENLİ</div>
                <div className="text-green-700 text-sm space-y-2">
                  <div><strong>✅ Çek/Fatura Bilgileri:</strong> localStorage'da güvenle saklanır</div>
                  <div><strong>✅ Telegram Bot Ayarları:</strong> Her değişiklikte otomatik kaydedilir</div>
                  <div><strong>✅ Tema Tercihiniz:</strong> Güncelleme sonrası korunur</div>
                  <div><strong>✅ Bildirim Ayarları:</strong> Tüm tercihleriniz hatırlanır</div>
                  <div><strong>✅ Güncelleme Güvenliği:</strong> Veriler hiçbir zaman silinmez</div>
                </div>
              </div>
            </div>
          </div>

          {/* Otomatik Yedekleme Sistemi */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-blue-800 font-medium text-sm mb-2">🔄 Otomatik Koruma Sistemi</div>
                <div className="text-blue-700 text-sm space-y-1">
                  <div>• <strong>Her Değişiklik:</strong> Anında localStorage'a kaydedilir</div>
                  <div>• <strong>Dual-Write Sistemi:</strong> Veriler iki farklı yerde saklanır</div>
                  <div>• <strong>Güncelleme Öncesi:</strong> Otomatik yedek oluşturulur</div>
                  <div>• <strong>Hata Durumunda:</strong> Veriler otomatik geri yüklenir</div>
                </div>
              </div>
            </div>
          </div>

          {/* Güvenlik Uyarıları */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-red-800 font-bold text-lg mb-2">🔐 GÜVENLİK UYARILARI</div>
                <div className="text-red-700 text-sm space-y-2">
                  <div><strong>⚠️ Bot Token Güvenliği:</strong> Bot token'ınızı asla başkalarıyla paylaşmayın!</div>
                  <div><strong>🔒 Yerel Depolama:</strong> Token'lar bilgisayarınızda güvenle saklanır, internete gönderilmez</div>
                  <div><strong>🚫 Kötüye Kullanım:</strong> Token çalınırsa /revoke komutuyla iptal edin</div>
                  <div><strong>💡 Güvenlik İpucu:</strong> Bot'u sadece kendinizle kullanın, gruplara eklemeyin</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Token Güvenlik Durumu */}
          <div className={`rounded-lg p-4 mb-6 border ${
            settings.telegramBotToken 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                settings.telegramBotToken ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className={`font-medium ${
                  settings.telegramBotToken ? 'text-green-800' : 'text-gray-600'
                }`}>
                  Bot Token Durumu: {settings.telegramBotToken ? '✅ Tanımlı' : '⚠️ Tanımsız'}
                </div>
                <div className="text-sm text-gray-600">
                  {settings.telegramBotToken 
                    ? `Token: ...${settings.telegramBotToken.slice(-8)} (son 8 karakter)`
                    : 'Bot token henüz girilmemiş'
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Data */}
            <button
              onClick={onExportData}
              className="theme-button flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-colors"
            >
              <DownloadIcon className="w-5 h-5" />
              Verileri Dışa Aktar
            </button>

            {/* Import Data */}
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
                className="theme-button-secondary w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-colors"
              >
                <Upload className="w-5 h-5" />
                Verileri İçe Aktar
              </button>
            </div>
          </div>

          {/* Manuel Yedekleme Önerisi */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-yellow-800 font-medium text-sm mb-1">💡 Manuel Yedekleme Önerisi</div>
                <div className="text-yellow-700 text-sm space-y-1">
                  <div>• <strong>Aylık:</strong> "Verileri Dışa Aktar" ile yedek alın</div>
                  <div>• <strong>Güncelleme Öncesi:</strong> Ekstra güvenlik için yedekleyin</div>
                  <div>• <strong>Cihaz Değişikliği:</strong> Yedek dosyasını yeni cihaza aktarın</div>
                </div>
              </div>
            </div>
          </div>

          <div className="theme-info bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-blue-800 font-medium text-sm mb-1">💡 Veri Güvenliği</div>
                <div className="text-blue-700 text-sm space-y-1">
                  <div>• Verileriniz sadece bilgisayarınızda saklanır</div>
                  <div>• Hiçbir veri internete gönderilmez</div>
                  <div>• JSON formatında dışa aktarılır</div>
                  <div>• Güncelleme sırasında veriler otomatik korunur</div>
                  <div>• Telegram bot bilgileri şifrelenmeden saklanır</div>
                </div>
              </div>
            </div>
          </div>

          {/* Teknik Detaylar */}
          <details className="theme-bg-secondary rounded-lg p-4 border theme-border mt-4">
            <summary className="theme-text font-medium cursor-pointer">🔧 Teknik Detaylar</summary>
            <div className="theme-text-muted text-sm mt-3 space-y-1">
              <div><strong>Depolama Yöntemi:</strong> localStorage (tarayıcı yerel depolama)</div>
              <div><strong>Yedekleme Lokasyonu:</strong> AppData/Roaming/hatirlaticiniz/</div>
              <div><strong>Dosya Formatı:</strong> JSON (insan tarafından okunabilir)</div>
              <div><strong>Şifreleme:</strong> Yerel depolama için şifreleme gerekli değil</div>
              <div><strong>Sync Sistemi:</strong> localStorage ↔ AppData dual-write</div>
              <div><strong>Recovery:</strong> Otomatik hata kurtarma sistemi</div>
            </div>
          </details>
        </div>

      </div>
    </div>
  );
}
