import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import CheckList from './components/CheckList';
import CheckForm from './components/CheckForm';
import AddUnified from './components/AddUnified';
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
import { useMedications as useLocalMedications } from './hooks/useMedications';
import { useDataMigration } from './hooks/useDataMigration';
import MigrationPrompt from './components/MigrationPrompt';
import { deleteUserAccount } from './utils/accountUtils';
import { Check, Settings as SettingsType, ThemeType, LoginData, RegisterData } from './types';
import { Medication } from './types/medication';

const defaultSettings: SettingsType = {
  reminderDays: 3,
  notificationsEnabled: true,
  autoUpdateEnabled: true,
  launchOnStartup: false,
  // Yeni bildirim ayarları
  dailyNotificationEnabled: true, // Günlük bildirim açık/kapalı
  dailyNotificationTime: '09:00', // "09:00" formatında
  lastNotificationCheck: '', // Son bildirim kontrolü tarihi
  // Eski ödemeleri otomatik silme
  autoDeleteAfterDays: 0,
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
  // Eğer auth loading beklenenden uzun sürerse login ekranını gösterme fallback'i
  const [authLoadFallback, setAuthLoadFallback] = useState(false);
  
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
    getDailySchedule,
    addMedication,
    updateMedication,
    markMedicationTaken
  } = useSupabaseMedications();

  const {
    getDailySchedule: getDailyScheduleLocal,
    markMedicationTaken: markMedicationTakenLocal,
  } = useLocalMedications();
  
  // Migration system
  const {
    migrationStatus,
    runMigration,
    skipMigration
  } = useDataMigration();
  
  // Fallback to localStorage for backward compatibility during transition
  const [fallbackChecks, setFallbackChecks] = useLocalStorage<Check[]>('checks', []);
  const [fallbackSettings, setFallbackSettings] = useLocalStorage<SettingsType>('settings', defaultSettings);
  
  // Use Supabase data if authenticated, otherwise fallback to localStorage
  const activeChecks = isAuthenticated ? checks : fallbackChecks;
  const activeSettings = isAuthenticated && Object.keys(settings).length > 2 ? settings : fallbackSettings;
  
  const medicationSchedule = isAuthenticated
    ? getDailySchedule(new Date())
    : getDailyScheduleLocal(new Date().toISOString()).medications;

  // Bildirim hook'u - use active settings and persist last notification check
  const handleDailyNotificationChecked = (iso: string) => {
    const next = { ...activeSettings, lastNotificationCheck: iso };
    if (isAuthenticated) {
      // Supabase'e yaz
      updateSupabaseSettings(next);
    } else {
      // localStorage fallback
      setFallbackSettings(next);
    }
  };

  useElectronNotifications(activeChecks, activeSettings, handleDailyNotificationChecked);

  // Tekrarlayan (aylık) ödemeler için vade sonrası otomatik ileri alma (günde 1 kez)
  useEffect(() => {
    // Yardımcı: Bir sonraki ayın aynı gününü hesapla
    const nextMonthSameDay = (baseIso: string, recurringDay?: number): string => {
      const base = new Date(baseIso);
      // Gün belirleme: varsa recurringDay, yoksa base'in günü
      const targetDay = recurringDay ?? base.getDate();
      const next = new Date(base);
      next.setMonth(next.getMonth() + 1);
      next.setDate(targetDay);
      next.setHours(0, 0, 0, 0);
      return next.toISOString().split('T')[0];
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Hangi tarih gösteriliyor? Tekrarlayan için nextPaymentDate, değilse paymentDate
    const getDisplayDate = (c: Check): string =>
      (c.isRecurring && c.nextPaymentDate) ? c.nextPaymentDate! : c.paymentDate;

    const needsAdvance = (c: Check): boolean => {
      if (!c.isRecurring) return false;
      if (c.recurringType !== 'monthly') return false; // Talep aylık için
      if (!c.isPaid) return false; // Sadece ödenmiş kayıtları ileri al
      const due = new Date(getDisplayDate(c));
      due.setHours(0, 0, 0, 0);
      // Vade gününden SONRA (ör. 11'inde) ileri al
      return today.getTime() > due.getTime();
    };

    // Günlük çalışma koruması: aynı günde ikinci kez çalışmayı engelle
    const todayIso = new Date().toISOString().split('T')[0];
    const lastRun = localStorage.getItem('lastRecurringAdvance');
    if (lastRun === todayIso) {
      return; // bugün zaten çalıştı
    }

    const candidates = activeChecks.filter(needsAdvance);
    if (candidates.length === 0) {
      // Yine de lastRun'ı güncelle, boş çalışmayı not et
      localStorage.setItem('lastRecurringAdvance', todayIso);
      return;
    }

    // Toplu olarak ileri al: isPaid=false ve tarihi bir sonraki ayın aynı günü
    const applyAdvance = async (c: Check) => {
      const baseIso = getDisplayDate(c);
      const nextIso = nextMonthSameDay(baseIso, c.recurringDay);
      const updates: Partial<Check> = { isPaid: false, nextPaymentDate: nextIso };
      if (isAuthenticated) {
        await updateSupabaseCheck(c.id, updates);
      } else {
        await setFallbackChecks(
          activeChecks.map((x) => (x.id === c.id ? { ...x, ...updates } : x))
        );
      }
    };

    // Her aday için bir kez uygula ve tamamlandığında günü işaretle
    (async () => {
      try {
        for (const c of candidates) {
          await applyAdvance(c);
        }
      } finally {
        localStorage.setItem('lastRecurringAdvance', todayIso);
      }
    })();
  }, [activeChecks, isAuthenticated]);

  // Otomatik silme: ödenmiş ödemeleri ödeme tarihinden X gün sonra temizle
  useEffect(() => {
    const days = activeSettings.autoDeleteAfterDays ?? 0;
    if (!days || days <= 0) return;

    const thresholdTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const shouldPrune = (c: Check) => {
      if (!c.isPaid) return false;
      const paymentTime = new Date(c.paymentDate).getTime();
      return paymentTime < thresholdTime;
    };

    const toPrune = activeChecks.filter(shouldPrune);
    if (toPrune.length === 0) return;

    if (isAuthenticated) {
      // Supabase tarafında tek tek sil
      toPrune.forEach((c) => {
        deleteSupabaseCheck(c.id);
      });
    } else {
      // localStorage fallback: filtrele ve yaz
      const kept = activeChecks.filter((c) => !shouldPrune(c));
      setFallbackChecks(kept);
    }
  }, [activeChecks, activeSettings.autoDeleteAfterDays, isAuthenticated]);

  // Authentication handlers
  const handleLogin = async (loginData: LoginData) => {
    setAuthError('');
    const result = await login(loginData);
    if (result.error) {
      setAuthError(result.error.message || 'Giriş yapılamadı');
    } else {
      navigate('/');
    }
  };

  const handleRegister = async (registerData: RegisterData) => {
    setAuthError('');
    const result = await register(registerData);
    if (result.error) {
      setAuthError(result.error.message || 'Kayıt olunamadı');
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Account deletion error:', error);
      alert(`Hesap silinirken bir hata oluştu: ${message}`);
    }
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
        if (import.meta.env.DEV) console.log('🔄 Clearing auth data...');
        clearAuthData();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 🎨 Tema uygulama hook'u
  useEffect(() => {
    const applyTheme = (theme: ThemeType) => {
      const root = document.documentElement;
      
      // HTML element'ine data-theme attribute'u ekle (CSS değişkenleri için)
      root.setAttribute('data-theme', theme);
      
      // Tailwind dark mode için class ekle/çıkar
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Body'ye tema class'ı ekle
      document.body.className = 'theme-bg min-h-screen';
      
      if (import.meta.env.DEV) console.log(`🎨 Tema uygulandı: ${theme}`);
    };

    applyTheme(activeSettings.theme);
  }, [activeSettings.theme]);

  // Auth yükleme beklenenden uzun sürerse login ekranına düş
  useEffect(() => {
    if (!isAuthenticated && authLoading) {
      const t = setTimeout(() => {
        setAuthLoadFallback(true);
      }, 2000);
      return () => clearTimeout(t);
    } else {
      setAuthLoadFallback(false);
    }
  }, [isAuthenticated, authLoading]);

  // Sistem başlangıcında otomatik başlatmayı ayarlama
  useEffect(() => {
    const enabled = !!activeSettings.launchOnStartup;
    try {
      if (window.electronAPI?.setLaunchOnStartup) {
        window.electronAPI.setLaunchOnStartup(enabled);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Auto-launch ayarı uygulanamadı:', e);
    }
  }, [activeSettings.launchOnStartup]);

  // Giriş durumuna göre güvenli yönlendirme ve loglama
  useEffect(() => {
    if (isAuthenticated) {
      // Eğer login/register sayfasında isek ana sayfaya geç
      if (location.pathname === '/login' || location.pathname === '/register') {
        if (import.meta.env.DEV) console.log('🔁 Auth true, /login|/register -> /');
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const setRawChecks = async (newChecks: Check[]) => {
    // For backward compatibility during migration period
    if (isAuthenticated && user) {
      // Use Supabase if user is authenticated
      if (import.meta.env.DEV) console.log('Using Supabase for check updates');
    } else {
      // Fallback to localStorage
      await setFallbackChecks(newChecks);
    }
  };

  const handleAddCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (isAuthenticated && user) {
      const ok = await addSupabaseCheck({ ...checkData, createdBy: user.id });
      if (ok) {
        navigate('/');
        return;
      }
      // Supabase başarısızsa yerel fallback dene
      const newCheck: Check = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isPaid: false,
        isRecurring: false,
      };
      await setRawChecks([newCheck, ...activeChecks]);
      navigate('/');
      return;
    } else {
      // Fallback for non-authenticated users (if needed)
      const newCheck: Check = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isPaid: false,
        isRecurring: false,
      };
      await setRawChecks([newCheck, ...activeChecks]);
      navigate('/');
    }
  };

  const handleUpdateCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!editingCheck) return;
    
    const updatedCheck: Check = {
      ...checkData,
      id: editingCheck.id,
      createdAt: editingCheck.createdAt
    };
    
    if (isAuthenticated) {
      const ok = await updateSupabaseCheck(updatedCheck.id, updatedCheck);
      if (!ok) {
        // Supabase başarısızsa yerel fallback
        await setRawChecks(
          activeChecks.map((c) => (c.id === updatedCheck.id ? updatedCheck : c))
        );
        setEditingCheck(null);
        navigate('/');
        return;
      }
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
      const ok = await toggleSupabasePaid(id);
      if (!ok) {
        // Supabase başarısızsa yerel fallback
        await setRawChecks(
          activeChecks.map((c) => (c.id === id ? { ...c, isPaid: !c.isPaid } : c))
        );
      }
    } else {
      await setRawChecks(
        activeChecks.map((c) => (c.id === id ? { ...c, isPaid: !c.isPaid } : c))
      );
    }
  };

  const handleEditCheck = (check: Check) => {
    setEditingCheck(check);
    navigate(`/edit/${check.id}`);
  };

  const handleUpdateSettings = async (newSettings: SettingsType) => {
    if (isAuthenticated) {
      await updateSupabaseSettings(newSettings);
    } else {
      // Fallback to localStorage
      setFallbackSettings(newSettings);
    }
    alert('Ayarlar kaydedildi!');
    navigate('/');
  };

  // 💊 Hap sistemi fonksiyonları
  const handleAddMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt'>) => {
    await addMedication(medicationData);
    navigate('/medications');
  };

  const handleUpdateMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt'>) => {
    if (editingMedication) {
      const updatedMedication: Medication = {
        ...medicationData,
        id: editingMedication.id,
        createdAt: editingMedication.createdAt
      };
      await updateMedication(updatedMedication.id, updatedMedication);
      setEditingMedication(null);
      navigate('/medications');
    }
  };

  const handleMarkMedicationTaken = async (
    medicationId: string,
    scheduledTime: string,
    status: 'taken' | 'missed' | 'skipped',
    notes?: string
  ) => {
    if (isAuthenticated) {
      await markMedicationTaken(medicationId, scheduledTime, status, notes);
    } else {
      await markMedicationTakenLocal(medicationId, status, notes);
    }
  };

  // Data export/import functions
  const handleExportData = () => {
    const data = {
      checks: activeChecks,
      settings: activeSettings,
      medications: medications,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hatirlaticiniz-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Handle import logic here
        if (import.meta.env.DEV) console.log('Import data:', data);
        alert('Veri içe aktarma özelliği henüz geliştirilmekte!');
      } catch (error) {
        alert('Geçersiz dosya formatı!');
      }
    };
    reader.readAsText(file);
  };

  if (authLoading && !authLoadFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="theme-text">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      {/* Force remount when auth state flips to avoid stale routing */}
      <Routes key={isAuthenticated ? 'auth' : 'guest'}>
        {/* Protected app layout: redirect to /login when not authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            index
            element={
              <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
                <CheckList
                  checks={activeChecks}
                  onEdit={handleEditCheck}
                  onDelete={handleDeleteCheck}
                  onTogglePaid={handleTogglePaid}
                />
              </div>
            }
          />
          <Route
            path="checks"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="add"
            element={<AddUnified onAddCheck={handleAddCheck} onAddMedication={handleAddMedication} onCancel={() => navigate('/')} />}
          />
          <Route
            path="edit/:id"
            element={
              editingCheck ? (
                <CheckForm
                  onSave={handleUpdateCheck}
                  onCancel={() => {
                    setEditingCheck(null);
                    navigate('/');
                  }}
                  initialData={editingCheck}
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
                onExportData={handleExportData}
                onImportData={handleImportData}
              />
            }
          />
          <Route
            path="profile"
            element={<Profile user={user} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />}
          />
          <Route path="medications">
            <Route
              index
              element={
                <MedicationList />
              }
            />
            <Route
              path="add"
              element={<Navigate to="/add?type=medication" replace />}
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
                    initialData={editingMedication}
                  />
                ) : (
                  <Navigate to="/medications" />
                )
              }
            />
          </Route>
          <Route
            path="schedule"
            element={<DailySchedule medicationSchedule={medicationSchedule} onMarkMedicationTaken={handleMarkMedicationTaken} />}
          />
          {/* Nested catch-all within app layout */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>

        {/* Public routes: login/register */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login
                onLogin={handleLogin}
                onSwitchToRegister={() => navigate('/register')}
                error={authError}
                isLoading={authLoading && !authLoadFallback}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Register
                onRegister={handleRegister}
                onSwitchToLogin={() => navigate('/login')}
                error={authError}
                isLoading={authLoading && !authLoadFallback}
              />
            )
          }
        />

        {/* Top-level catch-all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
      {migrationStatus.isNeeded && !migrationStatus.isComplete && location.pathname === '/' && (
        <MigrationPrompt 
          migrationStatus={migrationStatus}
          onRunMigration={runMigration} 
          onSkipMigration={skipMigration} 
        />
      )}
    </ErrorBoundary>
  );
}
