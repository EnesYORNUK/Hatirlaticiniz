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
  const [rawChecks, setRawChecks, checksLoaded] = useLocalStorage<any[]>('hatirlatici-checks', []);
  const [settings, setSettings, settingsLoaded] = useLocalStorage<SettingsType>('hatirlatici-settings', defaultSettings);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  // Eski veri formatını normalize et
  const checks: Check[] = rawChecks.map(normalizeCheck);

  // Bildirim sistemi
  const { isElectron } = useElectronNotifications(checks, settings);

  // Veriler yüklenene kadar loading göster
  if (!checksLoaded || !settingsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-900">Yükleniyor...</h2>
          <p className="text-gray-500 mt-2">Verileriniz hazırlanıyor</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    document.title = 'Hatırlatıcınım - Çek ve Fatura Takip Uygulaması';
  }, []);

  const handleAddCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    const newCheck: Check = {
      ...checkData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    await setRawChecks(prev => [...prev, newCheck]);
    setCurrentPage('list');
  };

  const handleEditCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!editingCheck) return;
    
    await setRawChecks(prev => prev.map(check => 
      check.id === editingCheck.id 
        ? { ...check, ...checkData }
        : check
    ));
    
    setEditingCheck(null);
    setCurrentPage('list');
  };

  const handleDeleteCheck = async (id: string) => {
    const itemType = checks.find(c => c.id === id)?.type === 'bill' ? 'faturayı' : 'çeki';
    if (confirm(`Bu ${itemType} silmek istediğinizden emin misiniz?`)) {
      await setRawChecks(prev => prev.filter(check => check.id !== id));
    }
  };

  const handleTogglePaid = async (id: string) => {
    await setRawChecks(prev => prev.map(check =>
      check.id === id ? { ...check, isPaid: !check.isPaid } : check
    ));
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

  const handleImportData = async (data: any) => {
    try {
      if (data.checks && Array.isArray(data.checks)) {
        if (confirm('Mevcut veriler silinecek ve yeni veriler yüklenecek. Devam etmek istiyor musunuz?')) {
          // Eski veri formatını normalize et
          const normalizedChecks = data.checks.map(normalizeCheck);
          await setRawChecks(normalizedChecks);
          if (data.settings) {
            await setSettings({ ...defaultSettings, ...data.settings });
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