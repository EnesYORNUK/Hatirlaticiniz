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

function App() {
  const [currentPage, setCurrentPage] = useState('list');
  const [checks, setChecks] = useLocalStorage<Check[]>('hatirlatici-checks', []);
  const [settings, setSettings] = useLocalStorage<SettingsType>('hatirlatici-settings', defaultSettings);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  // Bildirim sistemi
  const { isElectron } = useElectronNotifications(checks, settings);

  useEffect(() => {
    document.title = 'Hatırlatıcınım - Çek Takip Uygulaması';
  }, []);

  const handleAddCheck = (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    const newCheck: Check = {
      ...checkData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    setChecks(prev => [...prev, newCheck]);
    setCurrentPage('list');
  };

  const handleEditCheck = (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!editingCheck) return;
    
    setChecks(prev => prev.map(check => 
      check.id === editingCheck.id 
        ? { ...check, ...checkData }
        : check
    ));
    
    setEditingCheck(null);
    setCurrentPage('list');
  };

  const handleDeleteCheck = (id: string) => {
    if (confirm('Bu çeki silmek istediğinizden emin misiniz?')) {
      setChecks(prev => prev.filter(check => check.id !== id));
    }
  };

  const handleTogglePaid = (id: string) => {
    setChecks(prev => prev.map(check =>
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

  const handleSaveSettings = (newSettings: SettingsType) => {
    setSettings(newSettings);
  };

  const handleExportData = () => {
    const data = {
      checks,
      settings,
      exportDate: new Date().toISOString(),
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
          setChecks(data.checks);
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