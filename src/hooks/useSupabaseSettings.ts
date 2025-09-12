import { useState, useEffect } from 'react';
import { Settings as SettingsType } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const defaultSettings: SettingsType = {
  reminderDays: 3,
  notificationsEnabled: true,
  autoUpdateEnabled: true,
  dailyNotificationEnabled: true,
  dailyNotificationTime: '09:00',
  lastNotificationCheck: '',
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Supabase row to Settings type
  const convertRowToSettings = (row: any): SettingsType => ({
    reminderDays: row.reminder_days,
    notificationsEnabled: row.notifications_enabled,
    autoUpdateEnabled: row.auto_update_enabled,
    dailyNotificationEnabled: row.daily_notification_enabled,
    dailyNotificationTime: row.daily_notification_time,
    lastNotificationCheck: row.last_notification_check,
    telegramBotEnabled: row.telegram_bot_enabled,
    telegramBotToken: row.telegram_bot_token,
    telegramChatId: row.telegram_chat_id,
    theme: row.theme,
    medicationNotificationsEnabled: row.medication_notifications_enabled,
    medicationReminderMinutes: row.medication_reminder_minutes,
    showMedicationsInDashboard: row.show_medications_in_dashboard,
    medicationSoundEnabled: row.medication_sound_enabled,
  });

  // Convert Settings to Supabase update format
  const convertSettingsToUpdate = (settings: SettingsType): any => ({
    reminder_days: settings.reminderDays,
    notifications_enabled: settings.notificationsEnabled,
    auto_update_enabled: settings.autoUpdateEnabled,
    daily_notification_enabled: settings.dailyNotificationEnabled,
    daily_notification_time: settings.dailyNotificationTime,
    last_notification_check: settings.lastNotificationCheck,
    telegram_bot_enabled: settings.telegramBotEnabled,
    telegram_bot_token: settings.telegramBotToken,
    telegram_chat_id: settings.telegramChatId,
    theme: settings.theme,
    medication_notifications_enabled: settings.medicationNotificationsEnabled,
    medication_reminder_minutes: settings.medicationReminderMinutes,
    show_medications_in_dashboard: settings.showMedicationsInDashboard,
    medication_sound_enabled: settings.medicationSoundEnabled,
  });

  // Load settings from Supabase
  const loadSettings = async () => {
    if (!user || !isAuthenticated) {
      setSettings(defaultSettings);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          console.log('📝 Kullanıcı için varsayılan ayarlar oluşturuluyor...');
          await createDefaultSettings();
          return;
        }
        throw error;
      }

      const convertedSettings = convertRowToSettings(data);
      setSettings(convertedSettings);
      console.log('✅ Ayarlar Supabase\'den yüklendi');
    } catch (err: any) {
      console.error('❌ Ayarlar yüklenemedi:', err);
      setError(err.message);
      setSettings(defaultSettings); // Fallback to defaults
    } finally {
      setIsLoading(false);
    }
  };

  // Create default settings for new user
  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const insertData = {
        user_id: user.id,
        ...convertSettingsToUpdate(defaultSettings)
      };

      const { data, error } = await supabase
        .from('app_user_settings')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newSettings = convertRowToSettings(data);
      setSettings(newSettings);
      console.log('✅ Varsayılan ayarlar oluşturuldu');
    } catch (err: any) {
      console.error('❌ Varsayılan ayarlar oluşturulamadı:', err);
      setError(err.message);
    }
  };

  // Load settings when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    } else {
      setSettings(defaultSettings);
    }
  }, [user, isAuthenticated]);

  // Update settings
  const updateSettings = async (newSettings: SettingsType): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = convertSettingsToUpdate(newSettings);

      // @ts-ignore - Supabase typing issue
      const { data, error } = await supabase
        .from('app_user_settings')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedSettings = convertRowToSettings(data);
      setSettings(updatedSettings);
      console.log('✅ Ayarlar güncellendi');
      return true;
    } catch (err: any) {
      console.error('❌ Ayarlar güncellenemedi:', err);
      setError(err.message);
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
    } catch (err: any) {
      console.error('❌ Settings migration hatası:', err);
      setError(`Settings migration hatası: ${err.message}`);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    migrateFromLocalStorage,
    refreshSettings: loadSettings
  };
}