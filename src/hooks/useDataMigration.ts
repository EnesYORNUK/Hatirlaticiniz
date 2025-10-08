import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabaseChecks } from './useSupabaseChecks';
import { useSupabaseSettings } from './useSupabaseSettings';
import { useSupabaseMedications } from './useSupabaseMedications';

export function useDataMigration() {
  const { user, isAuthenticated } = useAuth();
  const { migrateFromLocalStorage: migrateChecks, checks, isLoading: checksLoading } = useSupabaseChecks();
  const { migrateFromLocalStorage: migrateSettings, settings, isLoading: settingsLoading } = useSupabaseSettings();
  const { migrateFromLocalStorage: migrateMedications, medications, isLoading: medicationsLoading } = useSupabaseMedications();
  
  const [migrationStatus, setMigrationStatus] = useState<{
    isNeeded: boolean;
    isRunning: boolean;
    isComplete: boolean;
    error: string | null;
    progress: string;
  }>({
    isNeeded: false,
    isRunning: false,
    isComplete: false,
    error: null,
    progress: ''
  });

  // Check if migration is needed
  const checkMigrationNeeded = (): boolean => {
    if (!isAuthenticated) return false;

    // Supabase verileri yüklenirken uyarıyı göstermeyelim (aksi halde overlay tüm tıklamaları bloklar)
    const isHooksLoading = checksLoading || settingsLoading || medicationsLoading;
    if (isHooksLoading) return false;

    const hasLocalChecks = localStorage.getItem('checks');
    const hasLocalSettings = localStorage.getItem('settings');
    const hasLocalMedications = localStorage.getItem('medications');
    const hasLocalMedicationLogs = localStorage.getItem('medication-logs');
    const migrationCompleted = localStorage.getItem('migration-completed') === 'true';

    // Eğer Supabase tarafında zaten veri varsa migration uyarısını gösterme
    const supabaseHasData = (checks && checks.length > 0)
      || (medications && medications.length > 0)
      || (settings && Object.keys(settings).length > 2);

    const needsMigration = !migrationCompleted && !supabaseHasData && Boolean(
      hasLocalChecks || 
      hasLocalSettings || 
      hasLocalMedications || 
      hasLocalMedicationLogs
    );

    return needsMigration;
  };

  // Check migration status when user state or supabase data changes
  useEffect(() => {
    if (isAuthenticated && user) {
      const isNeeded = checkMigrationNeeded();
      setMigrationStatus(prev => ({
        ...prev,
        isNeeded,
        isComplete: !isNeeded
      }));

      if (isNeeded) {
        console.log('🔄 LocalStorage verisi tespit edildi - migration gerekli');
      } else {
        console.log('✅ Migration gerekmez veya tamamlanmış');
      }
    } else {
      setMigrationStatus({
        isNeeded: false,
        isRunning: false,
        isComplete: false,
        error: null,
        progress: ''
      });
    }
  }, [user, isAuthenticated, checks, medications, settings, checksLoading, medicationsLoading, settingsLoading]);

  // Run migration
  const runMigration = async (): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      setMigrationStatus(prev => ({
        ...prev,
        error: 'Kullanıcı giriş yapmamış'
      }));
      return false;
    }

    setMigrationStatus(prev => ({
      ...prev,
      isRunning: true,
      error: null,
      progress: 'Migration başlatılıyor...'
    }));

    try {
      // Step 1: Migrate settings
      setMigrationStatus(prev => ({ ...prev, progress: 'Ayarlar migrate ediliyor...' }));
      const settingsSuccess = await migrateSettings();
      if (!settingsSuccess) {
        throw new Error('Ayarlar migrate edilemedi');
      }

      // Step 2: Migrate checks
      setMigrationStatus(prev => ({ ...prev, progress: 'Çekler migrate ediliyor...' }));
      const checksSuccess = await migrateChecks();
      if (!checksSuccess) {
        throw new Error('Çekler migrate edilemedi');
      }

      // Step 3: Migrate medications
      setMigrationStatus(prev => ({ ...prev, progress: 'İlaçlar migrate ediliyor...' }));
      const localMedications = JSON.parse(localStorage.getItem('medications') || '[]');
      const localMedicationLogs = JSON.parse(localStorage.getItem('medication-logs') || '[]');
      const medicationsSuccess = await migrateMedications({
        medications: localMedications,
        medicationLogs: localMedicationLogs
      });
      if (!medicationsSuccess) {
        throw new Error('İlaçlar migrate edilemedi');
      }

      // Mark migration as completed
      localStorage.setItem('migration-completed', 'true');
      
      setMigrationStatus({
        isNeeded: false,
        isRunning: false,
        isComplete: true,
        error: null,
        progress: 'Migration tamamlandı!'
      });

      console.log('✅ Tüm veriler başarıyla Supabase\'e migrate edildi!');
      return true;

    } catch (error: any) {
      console.error('❌ Migration hatası:', error);
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error.message || 'Migration sırasında hata oluştu',
        progress: 'Migration başarısız'
      }));
      return false;
    }
  };

  // Auto-run migration if needed (optional, can be called manually)
  const autoMigrate = async () => {
    if (migrationStatus.isNeeded && !migrationStatus.isRunning) {
      console.log('🔄 Otomatik migration başlatılıyor...');
      await runMigration();
    }
  };

  // Skip migration (for testing or if user doesn't want to migrate)
  const skipMigration = () => {
    localStorage.setItem('migration-completed', 'true');
    setMigrationStatus({
      isNeeded: false,
      isRunning: false,
      isComplete: true,
      error: null,
      progress: 'Migration atlandı'
    });
    console.log('⏭️ Migration atlandı');
  };

  // Reset migration status (for debugging)
  const resetMigration = () => {
    localStorage.removeItem('migration-completed');
    setMigrationStatus({
      isNeeded: checkMigrationNeeded(),
      isRunning: false,
      isComplete: false,
      error: null,
      progress: ''
    });
    console.log('🔄 Migration durumu sıfırlandı');
  };

  return {
    migrationStatus,
    runMigration,
    autoMigrate,
    skipMigration,
    resetMigration,
    checkMigrationNeeded
  };
}