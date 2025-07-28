import { useEffect, useCallback } from 'react';
import { Check, Settings } from '../types';
import { isToday, isDateInRange } from '../utils/dateUtils';

export function useElectronNotifications(checks: Check[], settings: Settings) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

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

    checks.forEach(check => {
      if (check.isPaid) return;

      // Hatırlatma günü bildirimi
      if (isDateInRange(check.paymentDate, settings.reminderDays)) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `${type} Ödeme Hatırlatması`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} TL tutarındaki ${type.toLowerCase()}in ödeme tarihi ${settings.reminderDays} gün sonra (${new Date(check.paymentDate).toLocaleDateString('tr-TR')})`
        );
      }

      // Ödeme günü bildirimi
      if (isToday(check.paymentDate)) {
        const type = check.type === 'bill' ? 'Fatura' : 'Çek';
        showNotification(
          `${type} Ödeme Günü!`,
          `${check.signedTo} - ${check.amount.toLocaleString('tr-TR')} TL tutarındaki ${type.toLowerCase()}in ödeme günü bugün!`
        );
      }
    });
  }, [checks, settings, showNotification]);

  useEffect(() => {
    if (!isElectron) {
      requestPermission();
    }
  }, [requestPermission, isElectron]);

  useEffect(() => {
    // İlk yüklenmede kontrol et
    checkForReminders();
    
    // Her 2 saatte bir kontrol et
    const shortInterval = setInterval(checkForReminders, 2 * 60 * 60 * 1000);
    
    // Her gün saat 09:00'da özel kontrol
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const msUntilTomorrow9AM = tomorrow.getTime() - now.getTime();
    
    const dailyTimeout = setTimeout(() => {
      checkForReminders();
      
      // Sonrasında her 24 saatte bir tekrarla
      const dailyInterval = setInterval(checkForReminders, 24 * 60 * 60 * 1000);
      
      return () => {
        clearInterval(dailyInterval);
      };
    }, msUntilTomorrow9AM);
    
    return () => {
      clearInterval(shortInterval);
      clearTimeout(dailyTimeout);
    };
  }, [checkForReminders]);

  return { requestPermission, showNotification, isElectron };
}