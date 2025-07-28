import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CheckForm from './components/CheckForm';
import CheckList from './components/CheckList';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useElectronNotifications } from './hooks/useElectronNotifications';
import { Check, Settings as SettingsType } from './types';

const defaultSettings: SettingsType = {
  reminderDays: 15,
  notificationsEnabled: false,
  autoUpdateEnabled: true,
  // Yeni bildirim ayarları
  dailyNotificationEnabled: false,
  dailyNotificationTime: '09:00',
  lastNotificationCheck: '',
  // Telegram bot ayarları
  telegramBotEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
};

// Eski check verilerini yeni formatla uyumlu hale getiren fonksiyon
const normalizeCheck = (check: any): Check => {
  return {
    ...check,
    // Yeni alanlar için default değerler
    type: check.type || 'check',
    billType: check.billType || undefined,
    customBillType: check.customBillType || undefined,
    isRecurring: check.isRecurring || false,
    recurringType: check.recurringType || undefined,
    recurringDay: check.recurringDay || undefined,
    nextPaymentDate: check.nextPaymentDate || undefined,
  };
};

function App() {
  const [currentPage, setCurrentPage] = useState('list');
  const [rawChecks, setRawChecks] = useLocalStorage<any[]>('hatirlatici-checks', []);
  const [settings, setSettings] = useLocalStorage<SettingsType>('hatirlatici-settings', defaultSettings);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  // Eski veri formatını normalize et
  const checks: Check[] = rawChecks.map(normalizeCheck);

  // Bildirim sistemi
  const { isElectron } = useElectronNotifications(checks, settings);

  useEffect(() => {
    document.title = 'Hatırlatıcınım - Çek ve Fatura Takip Uygulaması';
  }, []);

  const handleAddCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    const newCheck: Check = {
      ...checkData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedChecks = [...checks, newCheck];
    await setRawChecks(updatedChecks);
    setCurrentPage('list');
    
    // Tekrarlayan ödeme ise sonraki ödemeyi planla
    if (newCheck.isRecurring && newCheck.recurringType && newCheck.recurringDay) {
      // Bu özellik gelecekte eklenebilir
      console.log('Tekrarlayan ödeme eklendi:', newCheck);
    }
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
    const itemType = checks.find(c => c.id === id)?.type === 'bill' ? 'faturayı' : 'çeki';
    if (confirm(`Bu ${itemType} silmek istediğinizden emin misiniz?`)) {
      const updatedChecks = checks.filter(check => check.id !== id);
      await setRawChecks(updatedChecks);
    }
  };

  const handleTogglePaid = async (id: string) => {
    const updatedChecks = checks.map(check => 
      check.id === id ? { ...check, isPaid: !check.isPaid } : check
    );
    await setRawChecks(updatedChecks);
  };

  const handleStartEdit = (check: Check) => {
    setEditingCheck(check);
    setCurrentPage('add');
  };

  const handleCancelEdit = () => {
    setEditingCheck(null);
    setCurrentPage('list');
  };

  const handleSaveSettings = async (newSettings: SettingsType) => {
    await setSettings(newSettings);
  };

  const handleExportData = () => {
    const data = {
      checks: rawChecks,
      settings,
      exportDate: new Date().toISOString(),
      version: '2.0', // Versiyon bilgisi eklendi
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hatirlatici-yedek-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    try {
      if (data.checks && Array.isArray(data.checks)) {
        if (confirm('Mevcut veriler silinecek ve yeni veriler yüklenecek. Devam etmek istiyor musunuz?')) {
          // Eski veri formatını normalize et
          const normalizedChecks = data.checks.map(normalizeCheck);
          setRawChecks(normalizedChecks);
          if (data.settings) {
            setSettings({ ...defaultSettings, ...data.settings });
          }
          alert('Veriler başarıyla içe aktarıldı!');
        }
      } else {
        alert('Geçersiz dosya formatı!');
      }
    } catch (error) {
      alert('Dosya işlenirken hata oluştu!');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'add':
        return editingCheck ? (
          <CheckForm
            key={editingCheck.id}
            initialData={editingCheck}
            onSave={handleEditCheck}
            onCancel={handleCancelEdit}
          />
        ) : (
          <CheckForm
            onSave={handleAddCheck}
            onCancel={() => setCurrentPage('list')}
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
            onEdit={handleStartEdit}
            onDelete={handleDeleteCheck}
            onTogglePaid={handleTogglePaid}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage()}
      </Layout>
    </ErrorBoundary>
  );
}

export default App;