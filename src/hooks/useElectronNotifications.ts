import { useEffect, useCallback } from 'react';
import { Check, Settings, NotificationHistory } from '../types';
import { getDaysUntilPayment } from '../utils/dateUtils';
import { useSupabaseMedications } from './useSupabaseMedications';

export function useElectronNotifications(checks: Check[], settings: Settings) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  
  // İlaç hook'u - use Supabase version
  const { getDailySchedule, medications } = useSupabaseMedications();

  // Bildirim geçmişini localStorage'dan yükle/kaydet
  const getNotificationHistory = useCallback((): NotificationHistory[] => {
    try {
      const history = localStorage.getItem('hatirlatici-notification-history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }, []);

  const saveNotificationHistory = useCallback((history: NotificationHistory[]) => {
    try {
      localStorage.setItem('hatirlatici-notification-history', JSON.stringify(history));
    } catch (error: unknown) {
      console.error('Bildirim geçmişi kaydedilemedi:', error);
    }
  }, []);

  // Bildirim gönderme fonksiyonu (Telegram entegrasyonu electron.cjs'te yapıldı)
  const showNotification = useCallback(async (title: string, body: string) => {
    try {
      if (isElectron && window.electronAPI) {
        // Electron üzerinden hem masaüstü hem telegram bildirimi gönderilir
        await window.electronAPI.showNotification(title, body);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/vite.svg',
          requireInteraction: true,
        });
      }
    } catch (error: unknown) {
      console.error('Bildirim gönderilemedi:', error);
    }
  }, [isElectron]);

  // Web notification izni iste
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Bildirim gönder ve geçmişe kaydet
  const sendNotificationWithHistory = useCallback((
    check: Check | null,
    notificationType: 'daily' | 'reminder' | 'due-today' | 'medication',
    title: string,
    body: string,
    medicationId?: string
  ) => {
    showNotification(title, body);

    // Geçmişe kaydet
    const history = getNotificationHistory();
    const newEntry: NotificationHistory = {
      checkId: check ? check.id : (medicationId || 'unknown'),
      notificationType,
      sentAt: new Date().toISOString(),
      paymentDate: check ? check.paymentDate : new Date().toISOString().split('T')[0],
      medicationId: medicationId || undefined,
    };
    
    history.push(newEntry);
    
    // Eski kayıtları temizle (30 günden eski)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cleanHistory = history.filter(h => 
      new Date(h.sentAt) > thirtyDaysAgo
    );
    
    saveNotificationHistory(cleanHistory);
  }, [getNotificationHistory, saveNotificationHistory, showNotification]);

  // Günlük bildirim saati geldi mi kontrol et
  const isDailyNotificationTime = (): boolean => {
    if (!settings.dailyNotificationEnabled) return false;
    
    const now = new Date();
    const [hours, minutes] = settings.dailyNotificationTime.split(':').map(Number);
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const targetTime = hours * 60 + minutes;
    
    // ±5 dakika tolerans
    return Math.abs(currentTime - targetTime) <= 5;
  };

  // Son günlük kontrol bugün yapıldı mı?
  const wasDailyCheckDoneToday = (): boolean => {
    const lastCheck = settings.lastNotificationCheck;
    if (!lastCheck) return false;
    
    const today = new Date().toDateString();
    const lastCheckDate = new Date(lastCheck).toDateString();
    
    return today === lastCheckDate;
  };

  // Hatırlatma ve ödeme günü bildirimlerini kontrol et
  const checkNotifications = useCallback(() => {
    if (!settings.notificationsEnabled) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    checks.forEach(check => {
      if (check.isPaid) return; // Ödenmiş çekleri atla
      
      const daysUntil = getDaysUntilPayment(check.paymentDate);
      
      // Hatırlatma bildirimi (X gün önce)
      if (daysUntil === settings.reminderDays && daysUntil > 0) {
        sendNotificationWithHistory(
          check,
          'reminder',
          '⏰ Ödeme Hatırlatması',
          `${check.signedTo} için ${check.amount}₺ tutarındaki ${check.type === 'check' ? 'çek' : 'fatura'} ${daysUntil} gün sonra ödenecek.`
        );
      }
      
      // Bugün ödenecek bildirimi
      if (check.paymentDate === todayStr) {
        sendNotificationWithHistory(
          check,
          'due-today',
          '🚨 Bugün Ödenecek!',
          `${check.signedTo} için ${check.amount}₺ tutarındaki ${check.type === 'check' ? 'çek' : 'fatura'} bugün ödenecek.`
        );
      }
    });
  }, [checks, settings.notificationsEnabled, settings.reminderDays, sendNotificationWithHistory]);

  // İlaç hatırlatmalarını kontrol et
  const checkMedicationReminders = useCallback(() => {
    if (!settings.medicationNotificationsEnabled) return;
    
    const now = new Date();
    const reminderMinutes = settings.medicationReminderMinutes || 30;
    const todaySchedule = getDailySchedule();
    
    todaySchedule.forEach(item => {
      // Zaten alınmış veya zamanlanmamış ilaçları atla
      if (item.status === 'taken' || !item.scheduledTime) return;
      
      // Planlanan zamanı hesapla
      const [hours, minutes] = item.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(now);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      // Şu anki zaman ile planlanan zaman arasındaki fark (dakika)
      const diffMs = scheduledDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      // Hatırlatma zamanı geldi mi?
      if (diffMinutes > 0 && diffMinutes <= reminderMinutes) {
        const medication = medications.find(m => m.id === item.medication.id);
        if (!medication) return;
        
        const timeStr = item.scheduledTime.substring(0, 5); // HH:MM formatı
        
        sendNotificationWithHistory(
          null,
          'medication',
          `💊 İlaç Hatırlatması`,
          `${medication.name} ilacını ${timeStr}'de almanız gerekiyor.`,
          medication.id
        );
      }
      
      // İlaç alma zamanı geçti mi? (15 dakika tolerans)
      if (diffMinutes < 0 && diffMinutes > -15) {
        const medication = medications.find(m => m.id === item.medication.id);
        if (!medication) return;
        
        const timeStr = item.scheduledTime.substring(0, 5); // HH:MM formatı
        
        sendNotificationWithHistory(
          null,
          'medication',
          `⏰ İlaç Zamanı Geçiyor`,
          `${medication.name} ilacını ${timeStr}'de almanız gerekiyordu.`,
          medication.id
        );
      }
    });
  }, [settings.medicationNotificationsEnabled, settings.medicationReminderMinutes, getDailySchedule, medications, sendNotificationWithHistory]);

  // Günlük özet bildirimi
  const sendDailySummary = useCallback(() => {
    if (!isDailyNotificationTime() || wasDailyCheckDoneToday()) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayChecks = checks.filter(check => 
      check.paymentDate === today && !check.isPaid
    );
    
    const todayMedications = getDailySchedule().filter(item => item.status !== 'taken');
    
    if (todayChecks.length > 0 || todayMedications.length > 0) {
      let message = '📋 Günlük Özet:\n';
      
      if (todayChecks.length > 0) {
        message += `💰 ${todayChecks.length} ödeme bugün yapılacak\n`;
      }
      
      if (todayMedications.length > 0) {
        message += `💊 ${todayMedications.length} ilaç alınacak`;
      }
      
      sendNotificationWithHistory(
        null,
        'daily',
        '📋 Günlük Özet',
        message
      );
    }
  }, [checks, getDailySchedule, sendNotificationWithHistory]);

  // Ana kontrol fonksiyonu
  const runNotificationChecks = useCallback(() => {
    try {
      checkNotifications();
      checkMedicationReminders();
      sendDailySummary();
    } catch (error: unknown) {
      console.error('Bildirim kontrolü sırasında hata:', error);
    }
  }, [checkNotifications, checkMedicationReminders, sendDailySummary]);

  // Periyodik kontroller
  useEffect(() => {
    // İlk kontrol
    runNotificationChecks();
    
    // Her dakika kontrol et
    const interval = setInterval(runNotificationChecks, 60000);
    
    return () => clearInterval(interval);
  }, [runNotificationChecks]);

  // Web notification izni iste (sadece web'de)
  useEffect(() => {
    if (!isElectron) {
      requestPermission();
    }
  }, [isElectron, requestPermission]);

  return {
    showNotification,
    requestPermission,
    runNotificationChecks
  };
}