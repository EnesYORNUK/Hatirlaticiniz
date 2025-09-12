import { useEffect, useCallback } from 'react';
import { Check, Settings } from '../types';

export function useNotifications(checks: Check[], settings: Settings) {
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, tag: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        tag,
        requireInteraction: true,
      });
    }
  }, []);

  const checkForReminders = useCallback(() => {
    if (!settings.notificationsEnabled) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    checks.forEach(check => {
      if (check.isPaid) return;

      const paymentDate = new Date(check.paymentDate);
      const reminderDate = new Date(paymentDate);
      reminderDate.setDate(paymentDate.getDate() - settings.reminderDays);
      
      const reminderDateStr = reminderDate.toISOString().split('T')[0];
      const paymentDateStr = paymentDate.toISOString().split('T')[0];

      // Hatırlatma günü bildirimi
      if (reminderDateStr === todayStr) {
        showNotification(
          'Çek Ödeme Hatırlatması',
          `${check.signedTo} tarafından imzalanan ${check.amount.toLocaleString('tr-TR')} TL tutarındaki çekin ödeme tarihi ${settings.reminderDays} gün sonra (${paymentDate.toLocaleDateString('tr-TR')})`,
          `reminder-${check.id}`
        );
      }

      // Ödeme günü bildirimi
      if (paymentDateStr === todayStr) {
        showNotification(
          'Çek Ödeme Günü!',
          `${check.signedTo} tarafından imzalanan ${check.amount.toLocaleString('tr-TR')} TL tutarındaki çekin ödeme günü bugün!`,
          `payment-${check.id}`
        );
      }
    });
  }, [checks, settings, showNotification]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    checkForReminders();
    
    // Her gün kontrol et
    const interval = setInterval(checkForReminders, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkForReminders]);

  return { requestPermission, showNotification };
}