import { useEffect, useCallback, useRef } from 'react';
import { Check, Settings } from '../types';
import { isToday, isDateInRange } from '../utils/dateUtils';

export function useElectronNotifications(checks: Check[], settings: Settings) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const lastNotificationCheck = useRef<string>('');
  const intervals = useRef<{
    short?: NodeJS.Timeout;
    daily?: NodeJS.Timeout;
  }>({});

  const showNotification = useCallback(async (title: string, body: string) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.showNotification(title, body);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        requireInteraction: true,
      });
    }
  }, [isElectron]);

  const requestPermission = useCallback(async () => {
    if (!isElectron && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, [isElectron]);

  const checkForReminders = useCallback(() => {
    if (!settings.notificationsEnabled) return;

    const today = new Date().toDateString();
    
    // Aynı gün içinde çok fazla bildirim göndermeyi engelle
    if (lastNotificationCheck.current === today) {
      return;
    }

    let hasNotifications = false;

    checks.forEach(check => {
      if (check.isPaid) return;

      // Hatırlatma günü bildirimi
      if (isDateInRange(check.paymentDate, settings.reminderDays)) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `${type} Ödeme Hatırlatması`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} TL tutarındaki ${type.toLowerCase()}in ödeme tarihi ${settings.reminderDays} gün sonra (${new Date(check.paymentDate).toLocaleDateString('tr-TR')})`
        );
        hasNotifications = true;
      }

      // Ödeme günü bildirimi
      if (isToday(check.paymentDate)) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `${type} Ödeme Günü!`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} TL tutarındaki ${type.toLowerCase()}in ödeme günü bugün!`
        );
        hasNotifications = true;
      }
    });

    // Bildirim gönderildiyse bugün için işaretle
    if (hasNotifications) {
      lastNotificationCheck.current = today;
    }
  }, [checks, settings, showNotification]);

  useEffect(() => {
    if (!isElectron) {
      requestPermission();
    }
  }, [requestPermission, isElectron]);

  useEffect(() => {
    // Önceki interval'ları temizle
    if (intervals.current.short) {
      clearInterval(intervals.current.short);
    }
    if (intervals.current.daily) {
      clearTimeout(intervals.current.daily);
    }

    // İlk yüklenmede kontrol et (sayfa değişimlerinde değil)
    const shouldCheck = lastNotificationCheck.current !== new Date().toDateString();
    if (shouldCheck) {
      checkForReminders();
    }
    
    // Her 2 saatte bir kontrol et (30 dakika çok sık)
    intervals.current.short = setInterval(checkForReminders, 2 * 60 * 60 * 1000); // 2 saat
    
    // Her gün saat 09:00'da özel kontrol
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const msUntilTomorrow9AM = tomorrow.getTime() - now.getTime();
    
    intervals.current.daily = setTimeout(() => {
      lastNotificationCheck.current = ''; // Reset günlük kontrol için
      checkForReminders();
      
      // Sonrasında her 24 saatte bir tekrarla
      const dailyInterval = setInterval(() => {
        lastNotificationCheck.current = ''; // Reset
        checkForReminders();
      }, 24 * 60 * 60 * 1000);
      
      intervals.current.daily = dailyInterval as any;
    }, msUntilTomorrow9AM);
    
    return () => {
      if (intervals.current.short) {
        clearInterval(intervals.current.short);
      }
      if (intervals.current.daily) {
        clearTimeout(intervals.current.daily);
      }
    };
  }, []); // Boş dependency - sadece mount/unmount'ta çalış

  return { requestPermission, showNotification, isElectron };
}