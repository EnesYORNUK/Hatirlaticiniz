import { useEffect, useCallback } from 'react';
import { Check, Settings } from '../types';
import { isToday, isDateInRange } from '../utils/dateUtils';

// Electron API'sinin varlığını kontrol et
// src/hooks/useElectronNotifications.ts
// src/hooks/useElectronNotifications.ts
declare global {
  interface Window {
    electronAPI?: {
      showNotification: (title: string, body: string) => Promise<void>;
      onMenuAction: (callback: () => void) => void;
      removeMenuListener: (callback: () => void) => void;
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      // BURADAKİ TİP TANIMI KESİNLİKLE AŞAĞIDAKİ GİBİ OLMALI:
      onUpdateStatus: (callback: (status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error', info: any) => void) => void;
    };
  }
}



export function useElectronNotifications(checks: Check[], settings: Settings) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const showNotification = useCallback(async (title: string, body: string) => {
    if (isElectron && window.electronAPI) {
      // Electron bildirimi
      await window.electronAPI.showNotification(title, body);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // Web bildirimi
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

      // Hatırlatma günü bildirimi - yeni utility fonksiyonu kullan
      if (isDateInRange(check.paymentDate, settings.reminderDays)) {
        showNotification(
          'Çek Ödeme Hatırlatması',
          `${check.signedTo} tarafından imzalanan ${check.amount.toLocaleString('tr-TR')} TL tutarındaki çekin ödeme tarihi ${settings.reminderDays} gün sonra (${new Date(check.paymentDate).toLocaleDateString('tr-TR')})`
        );
      }

      // Ödeme günü bildirimi - yeni utility fonksiyonu kullan
      if (isToday(check.paymentDate)) {
        showNotification(
          'Çek Ödeme Günü!',
          `${check.signedTo} tarafından imzalanan ${check.amount.toLocaleString('tr-TR')} TL tutarındaki çekin ödeme günü bugün!`
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
    // İlk yüklenmede hemen kontrol et
    checkForReminders();
    
    // Her 30 dakikada bir kontrol et (bildirim kaçırmamak için)
    const shortInterval = setInterval(checkForReminders, 30 * 60 * 1000); // 30 dakika
    
    // Her gün saat 09:00'da özel kontrol (günlük hatırlatmalar için)
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