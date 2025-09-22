import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import CheckList from './components/CheckList';
import CheckForm from './components/CheckForm';
import Settings from './components/Settings';
import Profile from './components/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import MedicationForm from './components/MedicationForm';
import MedicationList from './components/MedicationList';
import DailySchedule from './components/DailySchedule';
import Login from './components/Login';
import Register from './components/Register';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useElectronNotifications } from './hooks/useElectronNotifications';
import { useAuth } from './hooks/useAuth';
import { useSupabaseChecks } from './hooks/useSupabaseChecks';
import { useSupabaseSettings } from './hooks/useSupabaseSettings';
import { useSupabaseMedications } from './hooks/useSupabaseMedications';
import { useDataMigration } from './hooks/useDataMigration';
import MigrationPrompt from './components/MigrationPrompt';
import { deleteUserAccount } from './utils/accountUtils';
import { Check, Settings as SettingsType, ThemeType, LoginData, RegisterData } from './types';
import { Medication } from './types/medication';
import { supabase } from './lib/supabase';

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
  // 💊 Hap sistemi ayarları
  medicationNotificationsEnabled: true,
  medicationReminderMinutes: 15,
  showMedicationsInDashboard: true,
  medicationSoundEnabled: true,
};

export default function App() {
  // Authentication state
  const { user, isAuthenticated, isLoading: authLoading, login, register, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string>('');
  const isAuthAvailable = !!supabase;
  
  const [currentPage, setCurrentPage] = useState('list');
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  
  // Supabase hooks - replace localStorage
  const {
    checks,
    addCheck: addSupabaseCheck,
    updateCheck: updateSupabaseCheck,
    deleteCheck: deleteSupabaseCheck,
    togglePaid: toggleSupabasePaid
  } = useSupabaseChecks();
  
  const {
    settings,
    updateSettings: updateSupabaseSettings
  } = useSupabaseSettings();
  
  const {
    medications,
    getDailySchedule,
    addMedication,
    updateMedication,
    deleteMedication,
    markMedicationTaken
  } = useSupabaseMedications();
  
  // Migration system
  const {
    migrationStatus,
    runMigration,
    skipMigration
  } = useDataMigration();
  
  // Fallback to localStorage for backward compatibility during transition
  const [fallbackChecks, setFallbackChecks] = useLocalStorage<Check[]>('checks', []);
  const [fallbackSettings, setFallbackSettings] = useLocalStorage<SettingsType>('settings', defaultSettings);
  
  // Use Supabase data if available, otherwise fallback to localStorage
  const activeChecks = checks.length > 0 || !fallbackChecks.length ? checks : fallbackChecks;
  const activeSettings = Object.keys(settings).length > 2 ? settings : fallbackSettings;
  
  // Bildirim hook'u - use active settings
  useElectronNotifications(activeChecks, activeSettings);

  // Authentication handlers
  const handleLogin = async (loginData: LoginData) => {
    setAuthError('');
    const result = await login(loginData);
    if (!result.success) {
      setAuthError(result.error || 'Giriş yapılamadı');
    }
  };

  const handleRegister = async (registerData: RegisterData) => {
    setAuthError('');
    const result = await register(registerData);
    if (!result.success) {
      setAuthError(result.error || 'Kayıt olunamadı');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      await logout();
      setCurrentPage('list');
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (!user) return;

    const confirmation = window.confirm(
      'Hesabınızı kalkalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.'
    );

    if (!confirmation) return;

    try {
      const result = await deleteUserAccount(user.id);
      if (result.success) {
        alert('Hesabınız başarıyla silindi.');
        // User will be automatically logged out by the deleteUserAccount function
      } else {
        throw new Error(result.error || 'Hesap silinirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      alert(`Hesap silinirken bir hata oluştu: ${error.message}`);
    }
  };

  // Clear auth error when switching views
  const switchAuthView = (view: 'login' | 'register') => {
    setAuthView(view);
    setAuthError('');
  };

  // Debug function to clear localStorage
  const clearAuthData = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('users');
    window.location.reload();
  };

  // Add keyboard shortcut to clear auth data (Ctrl+Shift+L)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        console.log('🔄 Clearing auth data...');
        clearAuthData();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 🎨 Tema uygulama hook'u
  useEffect(() => {
    const applyTheme = (theme: ThemeType) => {
      // HTML element'ine data-theme attribute'u ekle
      document.documentElement.setAttribute('data-theme', theme);
      
      // Body'ye tema class'ı ekle
      document.body.className = 'theme-bg min-h-screen';
      
      console.log(`🎨 Tema uygulandı: ${theme}`);
    };

    applyTheme(activeSettings.theme);
  }, [activeSettings.theme]);

  const setRawChecks = async (newChecks: Check[]) => {
    // For backward compatibility during migration period
    if (isAuthenticated && user) {
      // Use Supabase if user is authenticated
      console.log('Using Supabase for check updates');
    } else {
      // Fallback to localStorage
      await setFallbackChecks(newChecks);
    }
  };

  const handleAddCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (isAuthenticated && user) {
      // Use Supabase
      const success = await addSupabaseCheck(checkData);
      if (success) {
        setCurrentPage('list');
      }
    } else {
      // Fallback to localStorage
      const newCheck: Check = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      await setRawChecks([...activeChecks, newCheck]);
      setCurrentPage('list');
    }
  };

  const handleEditCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!editingCheck) return;
    
    if (isAuthenticated && user) {
      // Use Supabase
      const success = await updateSupabaseCheck(editingCheck.id, checkData);
      if (success) {
        setEditingCheck(null);
        setCurrentPage('list');
      }
    } else {
      // Fallback to localStorage
      const updatedCheck: Check = {
        ...checkData,
        id: editingCheck.id,
        createdAt: editingCheck.createdAt,
      };
      
      const updatedChecks = activeChecks.map(check => 
        check.id === editingCheck.id ? updatedCheck : check
      );
      
      await setRawChecks(updatedChecks);
      setEditingCheck(null);
      setCurrentPage('list');
    }
  };

  const handleDeleteCheck = async (id: string) => {
    if (isAuthenticated && user) {
      // Use Supabase
      await deleteSupabaseCheck(id);
    } else {
      // Fallback to localStorage
      const updatedChecks = activeChecks.filter(check => check.id !== id);
      await setRawChecks(updatedChecks);
    }
  };

  const handleTogglePaid = async (id: string) => {
    if (isAuthenticated && user) {
      // Use Supabase
      await toggleSupabasePaid(id);
    } else {
      // Fallback to localStorage
      const updatedChecks = activeChecks.map(check =>
        check.id === id ? { ...check, isPaid: !check.isPaid } : check
      );
      await setRawChecks(updatedChecks);
    }
  };

  const handleEditCheckClick = (check: Check) => {
    setEditingCheck(check);
    setCurrentPage('add');
  };

  // Helper function to convert getTodaySchedule to DailyMedicationSchedule format
  const getTodayMedicationSchedule = () => {
    const todaySchedule = getDailySchedule();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      date: today,
      medications: todaySchedule.map((item: any) => ({
        medication: item.medication,
        scheduledTime: item.scheduledTime,
        log: item.log,
        status: item.status as 'pending' | 'taken' | 'missed' | 'skipped'
      }))
    };
  };

  // İlaç işlemleri - already using Supabase through useSupabaseMedications
  const handleAddMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt'>) => {
    const success = await addMedication(medicationData);
    if (success) {
      setCurrentPage('medications');
    }
  };

  const handleEditMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt'>) => {
    if (!editingMedication) return;
    const success = await updateMedication(editingMedication.id, medicationData);
    if (success) {
      setEditingMedication(null);
      setCurrentPage('medications');
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (window.confirm('Bu hapı silmek istediğinizden emin misiniz?')) {
      await deleteMedication(id);
    }
  };

  const handleToggleMedicationActive = async (id: string, isActive: boolean) => {
    await updateMedication(id, { isActive });
  };

  const handleEditMedicationClick = (medication: Medication) => {
    setEditingMedication(medication);
    setCurrentPage('add-medication');
  };

  // Ödeme olarak işaretle (günlük programdan)
  const handleMarkPaymentPaid = async (paymentId: string) => {
    await handleTogglePaid(paymentId);
  };

  // Bugünkü ödemeleri getir
  const getTodayPayments = () => {
    const today = new Date().toDateString();
    return activeChecks.filter(check => {
      if (check.isPaid) return false;
      
      let checkDate;
      if (check.isRecurring && check.nextPaymentDate) {
        checkDate = new Date(check.nextPaymentDate).toDateString();
      } else {
        checkDate = new Date(check.paymentDate).toDateString();
      }
      
      return checkDate === today;
    });
  };

  const handleSaveSettings = async (newSettings: SettingsType) => {
    if (isAuthenticated && user) {
      // Use Supabase
      await updateSupabaseSettings(newSettings);
    } else {
      // Fallback to localStorage
      await setFallbackSettings(newSettings);
    }
  };

  const handleExportData = () => {
    const data = {
      checks: activeChecks,
      settings: activeSettings,
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
        
        if (data.checks) {
          setFallbackChecks(data.checks);
        }
        if (data.settings) {
          setFallbackSettings(data.settings);
        }
        
        alert('Veriler başarıyla içe aktarıldı!');
      } catch {
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
      case 'add-medication':
        return (
          <MedicationForm
            onSave={editingMedication ? handleEditMedication : handleAddMedication}
            onCancel={() => {
              setEditingMedication(null);
              setCurrentPage('medications');
            }}
            initialData={editingMedication || undefined}
          />
        );
      case 'medications':
        return (
          <MedicationList
            medications={medications}
            onEdit={handleEditMedicationClick}
            onDelete={handleDeleteMedication}
            onToggleActive={handleToggleMedicationActive}
          />
        );
      case 'daily-schedule':
        return (
          <DailySchedule
            medicationSchedule={getTodayMedicationSchedule()}
            todayPayments={getTodayPayments()}
            onMarkMedicationTaken={markMedicationTaken}
            onMarkPaymentPaid={handleMarkPaymentPaid}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={activeSettings}
            onSave={handleSaveSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        );
      case 'profile':
        return (
          <Profile
            user={user}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      default:
        return (
          <CheckList
            checks={activeChecks}
            onEdit={handleEditCheckClick}
            onDelete={handleDeleteCheck}
            onTogglePaid={handleMarkPaymentPaid}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      {/* Show only login/register if not authenticated */}
      {!isAuthenticated ? (
        <div className="min-h-screen theme-bg">
          {authLoading ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="theme-text text-sm">Yüklüyor...</p>
              </div>
            </div>
          ) : (
            <div>
              {authView === 'login' ? (
                <Login
                  onLogin={handleLogin}
                  onSwitchToRegister={() => switchAuthView('register')}
                  isLoading={authLoading}
                  error={authError}
                  isAuthAvailable={isAuthAvailable}
                />
              ) : (
                <Register
                  onRegister={handleRegister}
                  onSwitchToLogin={() => switchAuthView('login')}
                  isLoading={authLoading}
                  error={authError}
                  isAuthAvailable={isAuthAvailable}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        /* Show main app if authenticated */
        <>
          {/* Migration Prompt */}
          <MigrationPrompt 
            migrationStatus={migrationStatus}
            onRunMigration={runMigration}
            onSkipMigration={skipMigration}
          />
          
          <Layout 
            currentPage={currentPage} 
            onNavigate={setCurrentPage}
            user={user}
            onLogout={handleLogout}
          >
            {renderPage()}
          </Layout>
        </>
      )}
    </ErrorBoundary>
  );
}
