import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  const [authError, setAuthError] = useState<string>('');
  
  const navigate = useNavigate();
  const location = useLocation();

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
    isLoading: medicationsLoading,
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
  
  const medicationSchedule = getDailySchedule(new Date());

  // Bildirim hook'u - use active settings
  useElectronNotifications(activeChecks, activeSettings);

  // Authentication handlers
  const handleLogin = async (loginData: LoginData) => {
    setAuthError('');
    const result = await login(loginData);
    if (!result.success) {
      setAuthError(result.error || 'Giriş yapılamadı');
    } else {
      navigate('/');
    }
  };

  const handleRegister = async (registerData: RegisterData) => {
    setAuthError('');
    const result = await register(registerData);
    if (!result.success) {
      setAuthError(result.error || 'Kayıt olunamadı');
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      await logout();
      navigate('/login');
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
        navigate('/login');
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
    setAuthError('');
    navigate(view === 'login' ? '/login' : '/register');
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
      await addSupabaseCheck({ ...checkData, user_id: user.id });
    } else {
      // Fallback for non-authenticated users (if needed)
      const newCheck: Check = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        paid: false,
        isRecurring: false,
      };
      await setRawChecks([newCheck, ...activeChecks]);
    }
    navigate('/');
  };

  const handleUpdateCheck = async (updatedCheck: Check) => {
    if (isAuthenticated) {
      await updateSupabaseCheck(updatedCheck);
    } else {
      await setRawChecks(
        activeChecks.map((c) => (c.id === updatedCheck.id ? updatedCheck : c))
      );
    }
    setEditingCheck(null);
    navigate('/');
  };

  const handleDeleteCheck = async (id: string) => {
    if (window.confirm('Bu kontrolü silmek istediğinizden emin misiniz?')) {
      if (isAuthenticated) {
        await deleteSupabaseCheck(id);
      } else {
        await setRawChecks(activeChecks.filter((c) => c.id !== id));
      }
    }
  };

  const handleTogglePaid = async (id: string) => {
    if (isAuthenticated) {
      await toggleSupabasePaid(id);
    } else {
      await setRawChecks(
        activeChecks.map((c) => (c.id === id ? { ...c, paid: !c.paid } : c))
      );
    }
  };

  const handleEditCheck = (check: Check) => {
    setEditingCheck(check);
    navigate(`/edit/${check.id}`);
  };

  const handleUpdateSettings = async (newSettings: Partial<SettingsType>) => {
    if (isAuthenticated) {
      await updateSupabaseSettings(newSettings);
    } else {
      // Fallback to localStorage
      setFallbackSettings({ ...activeSettings, ...newSettings });
    }
    alert('Ayarlar kaydedildi!');
    navigate('/');
  };

  // 💊 Hap sistemi fonksiyonları
  const handleAddMedication = async (medication: Omit<Medication, 'id' | 'user_id'>) => {
    await addMedication(medication);
    navigate('/medications');
  };

  const handleUpdateMedication = async (medication: Medication) => {
    await updateMedication(medication);
    setEditingMedication(null);
    navigate('/medications');
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    navigate(`/medications/edit/${medication.id}`);
  };

  const handleDeleteMedication = async (id: string) => {
    if (window.confirm('Bu ilacı silmek istediğinizden emin misiniz?')) {
      await deleteMedication(id);
    }
  };

  const handleMarkMedicationTaken = async (medicationId: string, time: string) => {
    await markMedicationTaken(medicationId, time);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }
  
  return (
    <ErrorBoundary>
      <Routes>
        {isAuthenticated ? (
          <Route 
            path="/" 
            element={
              <Layout 
                user={user}
                settings={activeSettings} 
                onLogout={handleLogout}
                showMedicationsInDashboard={activeSettings.showMedicationsInDashboard}
                medications={medications}
                medicationSchedule={medicationSchedule}
                onMarkTaken={handleMarkMedicationTaken}
              />
            }
          >
            <Route 
              index 
              element={
                <CheckList
                  checks={activeChecks}
                  onEdit={handleEditCheck}
                  onDelete={handleDeleteCheck}
                  onTogglePaid={handleTogglePaid}
                  onAdd={() => navigate('/add')}
                />
              } 
            />
            <Route 
              path="add" 
              element={
                <CheckForm
                  onAddCheck={handleAddCheck}
                  onCancel={() => navigate('/')}
                />
              } 
            />
            <Route 
              path="edit/:id" 
              element={
                editingCheck ? (
                  <CheckForm
                    onAddCheck={handleUpdateCheck}
                    onCancel={() => {
                      setEditingCheck(null);
                      navigate('/');
                    }}
                    editingCheck={editingCheck}
                  />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route 
              path="settings" 
              element={
                <Settings
                  settings={activeSettings}
                  onSave={handleUpdateSettings}
                  onCancel={() => navigate('/')}
                />
              } 
            />
            <Route 
              path="profile" 
              element={
                <Profile 
                  user={user} 
                  onLogout={handleLogout} 
                  onDeleteAccount={handleDeleteAccount} 
                />
              } 
            />
            <Route path="medications">
              <Route 
                index 
                element={
                  <MedicationList
                    medications={medications}
                    onEdit={handleEditMedication}
                    onDelete={handleDeleteMedication}
                    onAdd={() => navigate('/medications/add')}
                    isLoading={medicationsLoading}
                  />
                }
              />
              <Route 
                path="add" 
                element={
                  <MedicationForm
                    onSave={handleAddMedication}
                    onCancel={() => navigate('/medications')}
                  />
                }
              />
              <Route 
                path="edit/:id" 
                element={
                  editingMedication ? (
                    <MedicationForm
                      onSave={handleUpdateMedication}
                      onCancel={() => {
                        setEditingMedication(null);
                        navigate('/medications');
                      }}
                      editingMedication={editingMedication}
                    />
                  ) : (
                    <Navigate to="/medications" />
                  )
                }
              />
            </Route>
            <Route 
              path="schedule" 
              element={
                <DailySchedule 
                  schedule={medicationSchedule} 
                  onMarkTaken={handleMarkMedicationTaken} 
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <>
            <Route 
              path="/login" 
              element={
                <Login 
                  onLogin={handleLogin} 
                  onSwitchToRegister={() => navigate('/register')} 
                  error={authError} 
                  isLoading={authLoading}
                />
              } 
            />
            <Route 
              path="/register" 
              element={
                <Register 
                  onRegister={handleRegister} 
                  onSwitchToLogin={() => navigate('/login')} 
                  error={authError} 
                  isLoading={authLoading}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
      {migrationStatus === 'pending' && (
        <MigrationPrompt onMigrate={runMigration} onSkip={skipMigration} />
      )}
    </ErrorBoundary>
  );
}
