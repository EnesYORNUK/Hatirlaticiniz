import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabaseChecks } from './useSupabaseChecks';
import { useSupabaseSettings } from './useSupabaseSettings';
import { useSupabaseMedications } from './useSupabaseMedications';

export function useDataMigration() {
  const { user, isAuthenticated } = useAuth();
  const { migrateFromLocalStorage: migrateChecks } = useSupabaseChecks();
  const { migrateFromLocalStorage: migrateSettings } = useSupabaseSettings();
  const { migrateFromLocalStorage: migrateMedications } = useSupabaseMedications();
  
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

    const hasLocalChecks = localStorage.getItem('checks');
    const hasLocalSettings = localStorage.getItem('settings');
    const hasLocalMedications = localStorage.getItem('medications');
    const hasLocalMedicationLogs = localStorage.getItem('medication-logs');
    const migrationCompleted = localStorage.getItem('migration-completed');

    const needsMigration = !migrationCompleted && Boolean(
      hasLocalChecks || 
      hasLocalSettings || 
      hasLocalMedications || 
      hasLocalMedicationLogs
    );

    return needsMigration;
  };

  // Check migration status when user state changes
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
  }, [user, isAuthenticated]);

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
      const medicationsSuccess = await migrateMedications();
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