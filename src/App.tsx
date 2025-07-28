import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import CheckList from './components/CheckList';
import CheckForm from './components/CheckForm';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useElectronNotifications } from './hooks/useElectronNotifications';
import { Check, Settings as SettingsType, ThemeType } from './types';

const defaultSettings: SettingsType = {
  reminderDays: 3,
  notificationsEnabled: true,
  autoUpdateEnabled: true,
  // Yeni bildirim ayarları
  dailyNotificationEnabled: true, // Günlük bildirim açık/kapalı
  dailyNotificationTime: '09:00', // "09:00" formatında
  lastNotificationCheck: '', // Son bildirim kontrolü tarihi
  // Telegram bot ayarları
  telegramBotEnabled: false, // Telegram bot açık/kapalı
  telegramBotToken: '', // Bot token (@BotFather'dan alınan)
  telegramChatId: '', // Kullanıcının chat ID'si
  theme: 'light' as ThemeType, // 🎨 Default theme
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('list');
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  
  const [checks, setChecks] = useLocalStorage<Check[]>('checks', []);
  const [settings, setSettings] = useLocalStorage<SettingsType>('settings', defaultSettings);
  
  // Bildirim hook'u
  useElectronNotifications(checks, settings);

  // 🎨 Tema uygulama hook'u
  useEffect(() => {
    const applyTheme = (theme: ThemeType) => {
      // HTML element'ine data-theme attribute'u ekle
      document.documentElement.setAttribute('data-theme', theme);
      
      // Body'ye tema class'ı ekle
      document.body.className = 'theme-bg min-h-screen';
      
      console.log(`🎨 Tema uygulandı: ${theme}`);
    };

    applyTheme(settings.theme);
  }, [settings.theme]);

  const setRawChecks = async (newChecks: Check[]) => {
    await setChecks(newChecks);
  };

  const handleAddCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    const newCheck: Check = {
      ...checkData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    await setRawChecks([...checks, newCheck]);
    setCurrentPage('list');
  };

  const handleEditCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!editingCheck) return;
    
    const updatedCheck: Check = {
      ...checkData,
      id: editingCheck.id,
      createdAt: editingCheck.createdAt,
    };
    
    const updatedChecks = checks.map(check => 
      check.id === editingCheck.id ? updatedCheck : check
    );
    
    await setRawChecks(updatedChecks);
    setEditingCheck(null);
    setCurrentPage('list');
  };

  const handleDeleteCheck = async (id: string) => {
    const updatedChecks = checks.filter(check => check.id !== id);
    await setRawChecks(updatedChecks);
  };

  const handleTogglePaid = async (id: string) => {
    const updatedChecks = checks.map(check =>
      check.id === id ? { ...check, isPaid: !check.isPaid } : check
    );
    await setRawChecks(updatedChecks);
  };

  const handleEditButtonClick = (check: Check) => {
    setEditingCheck(check);
    setCurrentPage('add');
  };

  const handleSaveSettings = async (newSettings: SettingsType) => {
    await setSettings(newSettings);
  };

  const handleExportData = () => {
    const data = {
      checks,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hatirlaticiniz-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.checks && Array.isArray(data.checks)) {
          setChecks(data.checks);
        }
        
        if (data.settings && typeof data.settings === 'object') {
          setSettings({ ...defaultSettings, ...data.settings });
        }
        
        alert('Veriler başarıyla içe aktarıldı!');
      } catch (error) {
        alert('Dosya formatı hatalı!');
      }
    };
    
    reader.readAsText(file);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'add':
        return (
          <CheckForm
            onSave={editingCheck ? handleEditCheck : handleAddCheck}
            onCancel={() => {
              setEditingCheck(null);
              setCurrentPage('list');
            }}
            initialData={editingCheck || undefined}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSave={handleSaveSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        );
      default:
        return (
          <CheckList
            checks={checks}
            onEdit={handleEditButtonClick}
            onDelete={handleDeleteCheck}
            onTogglePaid={handleTogglePaid}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <Layout 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
      >
        {renderPage()}
      </Layout>
    </ErrorBoundary>
  );
}