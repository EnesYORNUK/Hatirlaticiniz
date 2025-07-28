import { useEffect, useCallback, useRef } from 'react';
import { Check, Settings, NotificationHistory } from '../types';
import { isToday, isDateInRange } from '../utils/dateUtils';

export function useElectronNotifications(checks: Check[], settings: Settings) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const lastCheckRef = useRef<string>('');

  // Bildirim geçmişini localStorage'dan yükle/kaydet
  const getNotificationHistory = (): NotificationHistory[] => {
    try {
      const history = localStorage.getItem('hatirlatici-notification-history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  const saveNotificationHistory = (history: NotificationHistory[]) => {
    try {
      localStorage.setItem('hatirlatici-notification-history', JSON.stringify(history));
    } catch (error) {
      console.error('Bildirim geçmişi kaydedilemedi:', error);
    }
  };

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
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
    }
  }, [isElectron]);

  // Web notification izni iste
  const requestPermission = useCallback(async () => {
    if (!isElectron && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, [isElectron]);

  // Belirli bir check için bildirim gönderilmiş mi kontrol et
  const hasNotificationBeenSent = (
    checkId: string, 
    notificationType: 'reminder' | 'due-today' | 'daily',
    paymentDate: string
  ): boolean => {
    const history = getNotificationHistory();
    
    if (notificationType === 'daily') {
      // Günlük bildirimler için sadece bugün gönderilmiş mi bak
      const today = new Date().toDateString();
      return history.some(h => 
        h.checkId === checkId && 
        h.notificationType === 'daily' &&
        new Date(h.sentAt).toDateString() === today
      );
    } else {
      // Reminder ve due-today için ödeme tarihine göre kontrol et
      return history.some(h => 
        h.checkId === checkId && 
        h.notificationType === notificationType &&
        h.paymentDate === paymentDate
      );
    }
  };

  // Bildirim gönder ve geçmişe kaydet
  const sendNotificationWithHistory = (
    check: Check,
    notificationType: 'reminder' | 'due-today' | 'daily',
    title: string,
    body: string
  ) => {
    // Zaten gönderilmiş mi kontrol et
    if (hasNotificationBeenSent(check.id, notificationType, check.paymentDate)) {
      return;
    }

    // Bildirimi gönder (Telegram entegrasyonu electron.cjs'te otomatik)
    showNotification(title, body);

    // Geçmişe kaydet
    const history = getNotificationHistory();
    const newEntry: NotificationHistory = {
      checkId: check.id,
      notificationType,
      sentAt: new Date().toISOString(),
      paymentDate: check.paymentDate,
    };
    
    history.push(newEntry);
    
    // Eski kayıtları temizle (30 günden eski)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cleanHistory = history.filter(h => 
      new Date(h.sentAt) > thirtyDaysAgo
    );
    
    saveNotificationHistory(cleanHistory);
  };

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
  const checkReminderNotifications = useCallback(() => {
    if (!settings.notificationsEnabled) return;

    checks.forEach(check => {
      if (check.isPaid) return;

      const type = check.type === 'bill' ? 'Fatura' : 'Çek';
      const company = check.signedTo;
      const amount = check.amount.toLocaleString('tr-TR');

      // Hatırlatma bildirimi (X gün önceden)
      if (isDateInRange(check.paymentDate, settings.reminderDays)) {
        const daysLeft = Math.ceil(
          (new Date(check.paymentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        sendNotificationWithHistory(
          check,
          'reminder',
          `💰 ${type} Ödeme Hatırlatması`,
          `${company} - ${amount} TL tutarındaki ${type.toLowerCase()}in ödeme tarihi ${daysLeft} gün sonra`
        );
      }

      // Ödeme günü bildirimi
      if (isToday(check.paymentDate)) {
        sendNotificationWithHistory(
          check,
          'due-today',
          `🔴 ${type} Ödeme Günü!`,
          `${company} - ${amount} TL tutarındaki ${type.toLowerCase()}in ödeme günü bugün!`
        );
      }
    });
  }, [checks, settings, showNotification]);

  // Günlük bildirimleri kontrol et
  const checkDailyNotifications = useCallback(() => {
    if (!settings.notificationsEnabled || !settings.dailyNotificationEnabled) return;
    if (wasDailyCheckDoneToday()) return;
    if (!isDailyNotificationTime()) return;

    // Bugün ödenmesi gereken ödemeler
    const todayPayments = checks.filter(check => 
      !check.isPaid && isToday(check.paymentDate)
    );

    if (todayPayments.length > 0) {
      // Günlük bildirim gönder
      const titles = todayPayments.map(check => {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        return `${check.signedTo} (${type})`;
      });

      showNotification(
        `📅 Bugün ${todayPayments.length} Ödeme Var`,
        `Ödenmesi gerekenler: ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ' ve diğerleri' : ''}`
      );

      // Her check için günlük bildirim geçmişine kaydet
      todayPayments.forEach(check => {
        const history = getNotificationHistory();
        const newEntry: NotificationHistory = {
          checkId: check.id,
          notificationType: 'daily',
          sentAt: new Date().toISOString(),
          paymentDate: check.paymentDate,
        };
        history.push(newEntry);
        saveNotificationHistory(history);
      });

      // Son kontrol zamanını güncelle
      const updatedSettings = {
        ...settings,
        lastNotificationCheck: new Date().toISOString(),
      };
      
      // Settings'i güncelleme - localStorage'a kaydet
      try {
        localStorage.setItem('hatirlatici-settings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('Settings güncellenemedi:', error);
      }
    }
  }, [checks, settings, showNotification]);

  // İzin isteme effect'i
  useEffect(() => {
    if (!isElectron) {
      requestPermission();
    }
  }, [requestPermission, isElectron]);

  // Ana bildirim kontrol effect'i
  useEffect(() => {
    // Sadece checks veya önemli settings değiştiğinde çalış
    const currentChecksum = JSON.stringify({
      checksCount: checks.length,
      notificationsEnabled: settings.notificationsEnabled,
      reminderDays: settings.reminderDays,
      dailyEnabled: settings.dailyNotificationEnabled,
      dailyTime: settings.dailyNotificationTime,
      telegramEnabled: settings.telegramBotEnabled, // Telegram ayarı da checksum'a dahil
    });

    // Gereksiz re-run'ları engelle
    if (lastCheckRef.current === currentChecksum) {
      return;
    }
    lastCheckRef.current = currentChecksum;

    // İlk kontrolleri yap
    checkReminderNotifications();
    checkDailyNotifications();

    // Periyodik kontroller için interval'lar
    const reminderInterval = setInterval(checkReminderNotifications, 60 * 60 * 1000); // Her saat
    const dailyInterval = setInterval(checkDailyNotifications, 5 * 60 * 1000); // Her 5 dakika

    return () => {
      clearInterval(reminderInterval);
      clearInterval(dailyInterval);
    };
  }, [checkReminderNotifications, checkDailyNotifications]);

  return { requestPermission, showNotification, isElectron };
}