import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsType, ThemeType } from '../types';
import { supabase, initializeSupabase } from '../lib/supabase';
import { TablesUpdate } from '../types/supabase-mcp';
import { useAuth } from './useAuth';

const defaultSettings: SettingsType = {
  reminderDays: 3,
  notificationsEnabled: true,
  autoUpdateEnabled: true,
  launchOnStartup: false,
  dailyNotificationEnabled: true,
  dailyNotificationTime: '09:00',
  lastNotificationCheck: '',
  autoDeleteAfterDays: 0,
  telegramBotEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  theme: 'light',
  medicationNotificationsEnabled: true,
  medicationReminderMinutes: 15,
  showMedicationsInDashboard: true,
  medicationSoundEnabled: true,
};

export function useSupabaseSettings() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSupabase();
  }, []);

  // Convert Supabase row to Settings type
  const convertRowToSettings = useCallback((row: Record<string, unknown>): SettingsType => ({
    reminderDays: row.reminder_days as number,
    notificationsEnabled: row.notifications_enabled as boolean,
    autoUpdateEnabled: row.auto_update_enabled as boolean,
    launchOnStartup: (row.launch_on_startup as boolean | null) ?? false,
    dailyNotificationEnabled: row.daily_notification_enabled as boolean,
    dailyNotificationTime: row.daily_notification_time as string,
    lastNotificationCheck: row.last_notification_check as string,
    autoDeleteAfterDays: (row.auto_delete_after_days as number | null) ?? 0,
    telegramBotEnabled: row.telegram_bot_enabled as boolean,
    telegramBotToken: row.telegram_bot_token as string,
    telegramChatId: row.telegram_chat_id as string,
    theme: row.theme as ThemeType,
    medicationNotificationsEnabled: row.medication_notifications_enabled as boolean,
    medicationReminderMinutes: row.medication_reminder_minutes as number,
    showMedicationsInDashboard: row.show_medications_in_dashboard as boolean,
    medicationSoundEnabled: row.medication_sound_enabled as boolean,
  }), []);

  // Convert Settings to Supabase update format
  const convertSettingsToUpdate = useCallback((settings: SettingsType): TablesUpdate<'app_user_settings'> => ({
    reminder_days: settings.reminderDays,
    notifications_enabled: settings.notificationsEnabled,
    auto_update_enabled: settings.autoUpdateEnabled,
    launch_on_startup: settings.launchOnStartup ?? false,
    daily_notification_enabled: settings.dailyNotificationEnabled,
    daily_notification_time: settings.dailyNotificationTime,
    last_notification_check: settings.lastNotificationCheck,
    auto_delete_after_days: settings.autoDeleteAfterDays,
    telegram_bot_enabled: settings.telegramBotEnabled,
    telegram_bot_token: settings.telegramBotToken,
    telegram_chat_id: settings.telegramChatId,
    theme: settings.theme,
    medication_notifications_enabled: settings.medicationNotificationsEnabled,
    medication_reminder_minutes: settings.medicationReminderMinutes,
    show_medications_in_dashboard: settings.showMedicationsInDashboard,
    medication_sound_enabled: settings.medicationSoundEnabled,
  }), []);

  // Create default settings in Supabase
  const createDefaultSettings = useCallback(async () => {
    if (!user) return;

    const client = supabase ?? await initializeSupabase();
    if (!client) return;

    try {
      const settingsData = {
        user_id: user.id,
        ...convertSettingsToUpdate(defaultSettings)
      };

      const { error } = await client
        .from('app_user_settings')
        .insert(settingsData as any);

      if (error) throw error;

      setSettings(defaultSettings);
      console.log('✅ Varsayılan ayarlar oluşturuldu');
    } catch (err: unknown) {
      console.error('❌ Varsayılan ayarlar oluşturulamadı:', (err as Error).message);
      setError((err as Error).message);
    }
  }, [user, convertSettingsToUpdate]);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    if (!user || !isAuthenticated) {
      return;
    }

    // Supabase guard with lazy init
    const client = supabase ?? await initializeSupabase();
    if (!client) {
      setError('Veri servisi kullanılamıyor');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await client
        .from('app_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const convertedSettings = convertRowToSettings(data);
        setSettings(convertedSettings);
        console.log('✅ Ayarlar Supabase\'den yüklendi');
      } else {
        // No settings found, create default
        await createDefaultSettings();
      }
    } catch (err: unknown) {
      console.error('❌ Ayarlar yüklenemedi:', (err as Error).message);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, createDefaultSettings, convertRowToSettings]);

  // Load settings when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    } else {
      setSettings(defaultSettings);
    }
  }, [user, isAuthenticated, loadSettings]);

  // Update settings
  const updateSettings = async (newSettings: SettingsType): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard with lazy init
    const client = supabase ?? await initializeSupabase();
    if (!client) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dinamik kolon uyumu: eksik kolon hatasında payload'ı daraltıp yeniden dene
      let updateData: Record<string, any> = { ...convertSettingsToUpdate(newSettings) };
      let attempts = 0;
      let lastError: any = null;
      while (attempts < 5) {
        const { data, error } = await client
          .from('app_user_settings')
          .update(updateData as any)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!error) {
          const updatedSettings = convertRowToSettings(data);
          setSettings(updatedSettings);
          console.log('✅ Ayarlar güncellendi');
          return true;
        }

        lastError = error;
        // PGRST204: Kolon bulunamadı -> mesajdan kolonu çıkar ve yeniden dene
        if (error.code === 'PGRST204' && typeof error.message === 'string') {
          const match = error.message.match(/'([^']+)'/);
          const missingColumn = match && match[1];
          if (missingColumn && missingColumn in updateData) {
            delete updateData[missingColumn];
            attempts += 1;
            continue;
          }
        }
        break; // Başka hata: döngüden çık
      }

      throw lastError || new Error('Ayar güncelleme başarısız');
    } catch (err: unknown) {
      console.error('❌ Ayarlar güncellenemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Migration function to import localStorage data
  const migrateFromLocalStorage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const localSettings = localStorage.getItem('settings');
      if (!localSettings) return true; // No data to migrate

      const parsedSettings: SettingsType = JSON.parse(localSettings);
      console.log('🔄 Ayarlar localStorage\'dan migrate ediliyor...');

      const success = await updateSettings(parsedSettings);
      if (success) {
        // Clear localStorage after successful migration
        localStorage.removeItem('settings');
        console.log('✅ Ayarlar başarıyla migrate edildi ve localStorage temizlendi');
      }
      
      return success;
    } catch (err: unknown) {
      console.error('❌ Settings migration hatası:', err);
      setError(`Settings migration hatası: ${(err as Error).message}`);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    migrateFromLocalStorage
  };
}