import { useEffect, useCallback, useRef } from 'react';
import { Check, Settings, NotificationHistory } from '../types';
import { isToday, isDateInRange, getDaysUntilPayment } from '../utils/dateUtils';
import { useMedications } from './useMedications';

export function useElectronNotifications(checks: Check[], settings: Settings) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const lastCheckRef = useRef<string>('');
  
  // İlaç hook'u
  const { getTodaySchedule, getUpcomingMedications } = useMedications();

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

  // Belirli bir check veya medication için bildirim gönderilmiş mi kontrol et
  const hasNotificationBeenSent = (
    checkId: string, 
    notificationType: 'reminder' | 'due-today' | 'daily' | 'medication',
    paymentDate: string,
    medicationId?: string
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

  // Bildirim gönder ve geçmişe kaydet (hem ödeme hem ilaç için)
  const sendNotificationWithHistory = (
    check: Check | null,
    notificationType: 'reminder' | 'due-today' | 'daily' | 'medication',
    title: string,
    body: string,
    medicationId?: string
  ) => {
    // Zaten gönderilmiş mi kontrol et
    const id = check ? check.id : medicationId || 'unknown';
    const paymentDate = check ? check.paymentDate : new Date().toISOString().split('T')[0];
    
    if (hasNotificationBeenSent(id, notificationType, paymentDate, medicationId)) {
      return;
    }

    // Bildirimi gönder (Telegram entegrasyonu electron.cjs'te otomatik)
    showNotification(title, body);

    // Geçmişe kaydet
    const history = getNotificationHistory();
    const newEntry: NotificationHistory = {
      checkId: check ? check.id : (medicationId || 'unknown'),
      notificationType,
      sentAt: new Date().toISOString(),
      paymentDate: check ? check.paymentDate : new Date().toISOString().split('T')[0],
      medicationId: medicationId,
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
      const daysUntil = getDaysUntilPayment(check.paymentDate, check.nextPaymentDate, check.isRecurring);
      if (daysUntil > 0 && daysUntil <= settings.reminderDays) {
        const daysLeft = daysUntil;
        
        sendNotificationWithHistory(
          check,
          'reminder',
          `💰 ${type} Ödeme Hatırlatması`,
          `${company} - ${amount} TL tutarındaki ${type.toLowerCase()}in ödeme tarihi ${daysLeft} gün sonra`
        );
      }

      // Ödeme günü bildirimi
      const checkDateToCheck = check.isRecurring && check.nextPaymentDate ? check.nextPaymentDate : check.paymentDate;
      if (isToday(checkDateToCheck)) {
        sendNotificationWithHistory(
          check,
          'due-today',
          `🔴 ${type} Ödeme Günü!`,
          `${company} - ${amount} TL tutarındaki ${type.toLowerCase()}in ödeme günü bugün!`
        );
      }
    });
  }, [checks, settings, showNotification]);

  // İlaç bildirimlerini kontrol et
  const checkMedicationNotifications = useCallback(() => {
    if (!settings.medicationNotificationsEnabled) return;

    const todaySchedule = getTodaySchedule();
    const now = new Date();
    const reminderMinutes = settings.medicationReminderMinutes || 15;

    todaySchedule.medications.forEach(item => {
      if (item.status !== 'pending') return; // Sadece bekleyen ilaçlar

      // Planlanan saat
      const scheduledDateTime = new Date(`${todaySchedule.date}T${item.scheduledTime}`);
      
      // Hatırlatma zamanı (X dakika önceden)
      const reminderTime = new Date(scheduledDateTime.getTime() - reminderMinutes * 60 * 1000);
      
      // Şimdi hatırlatma zamanı mı?
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
      const isReminderTime = timeDiff <= 2 * 60 * 1000; // 2 dakika tolerans

      if (isReminderTime) {
        sendNotificationWithHistory(
          null,
          'medication',
          `💊 İlaç Hatırlatması`,
          `${item.medication.name} (${item.medication.dosage}) - ${reminderMinutes} dakika sonra alınacak`,
          item.medication.id
        );
      }

      // Tam zamanı mı?
      const isExactTime = Math.abs(now.getTime() - scheduledDateTime.getTime()) <= 2 * 60 * 1000;
      
      if (isExactTime) {
        sendNotificationWithHistory(
          null,
          'medication',
          `⏰ İlaç Zamanı!`,
          `${item.medication.name} (${item.medication.dosage}) - Şimdi alınacak!`,
          item.medication.id
        );
      }

      // Gecikmiş ilaçlar (30 dakika sonrası)
      const isLate = now.getTime() > scheduledDateTime.getTime() + 30 * 60 * 1000;
      
      if (isLate) {
        const minutesLate = Math.floor((now.getTime() - scheduledDateTime.getTime()) / (60 * 1000));
        sendNotificationWithHistory(
          null,
          'medication',
          `⚠️ İlaç Gecikmesi`,
          `${item.medication.name} - ${minutesLate} dakika gecikti`,
          item.medication.id
        );
      }
    });
  }, [settings, getTodaySchedule, sendNotificationWithHistory]);

  // Günlük bildirim kontrolü
  const checkDailyNotifications = useCallback(() => {
    if (!settings.dailyNotificationEnabled || !settings.dailyNotificationTime) return;

    const now = new Date();
    const today = now.toDateString();
    
    // Bugün zaten kontrol edildi mi?
    if (settings.lastNotificationCheck === today) return;

    // Ayarlanan saat geldi mi?
    const [hour, minute] = settings.dailyNotificationTime.split(':').map(Number);
    const targetTime = new Date();
    targetTime.setHours(hour, minute, 0, 0);
    
    // 5 dakika tolerans
    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    if (timeDiff > 5 * 60 * 1000) return;

    // Günlük özet bildirimi gönder
    const unpaidChecks = checks.filter(c => !c.isPaid);
    const overdueChecks = unpaidChecks.filter(c => getDaysUntilPayment(c.paymentDate) < 0);
    const todayChecks = unpaidChecks.filter(c => {
      const checkDate = new Date(c.paymentDate);
      return checkDate.toDateString() === today;
    });

    let title = '📅 Günlük Ödeme Hatırlatıcısı';
    let body = '';

    if (overdueChecks.length > 0) {
      body += `⚠️ ${overdueChecks.length} gecikmiş ödeme var!\n`;
    }
    
    if (todayChecks.length > 0) {
      body += `🔴 Bugün ${todayChecks.length} ödeme var\n`;
    }
    
    if (unpaidChecks.length > 0) {
      body += `📋 Toplam ${unpaidChecks.length} bekleyen ödeme\n`;
      body += `💰 Toplam: ${unpaidChecks.reduce((sum, c) => sum + c.amount, 0).toLocaleString('tr-TR')} ₺`;
    } else {
      body = '🎉 Tüm ödemeler tamamlandı!';
    }

    showNotification(title, body);
    
    // Son kontrol tarihini güncelle
    if (window.electronAPI?.saveAppData) {
      window.electronAPI.saveAppData('settings', {
        ...settings,
        lastNotificationCheck: today
      });
    }
  }, [checks, settings, showNotification]);

  // Bilgisayar açıldığında bildirim kontrolü
  const checkStartupNotifications = useCallback(() => {
    if (!settings.notificationsEnabled) return;

    // Uygulama açıldıktan 2 saniye sonra kontrol et
    setTimeout(() => {
      const unpaidChecks = checks.filter(c => !c.isPaid);
      const overdueChecks = unpaidChecks.filter(c => getDaysUntilPayment(c.paymentDate) < 0);
      const todayChecks = unpaidChecks.filter(c => {
        const checkDate = new Date(c.paymentDate);
        return checkDate.toDateString() === new Date().toDateString();
      });

      if (overdueChecks.length > 0) {
        showNotification(
          '⚠️ Gecikmiş Ödemeler Var!',
          `${overdueChecks.length} ödeme vadesi geçmiş. Hemen kontrol edin!`
        );
      } else if (todayChecks.length > 0) {
        showNotification(
          '🔴 Bugün Ödenecek Ödemeler Var!',
          `${todayChecks.length} ödeme bugün vadesi doluyor.`
        );
      } else if (unpaidChecks.length > 0) {
        showNotification(
          '📋 Bekleyen Ödemeler',
          `${unpaidChecks.length} ödeme bekliyor. Toplam: ${unpaidChecks.reduce((sum, c) => sum + c.amount, 0).toLocaleString('tr-TR')} ₺`
        );
      }
    }, 2000);
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
    checkMedicationNotifications();
    checkStartupNotifications(); // Başlangıçta da çalıştır

    // Periyodik kontroller için interval'lar
    const reminderInterval = setInterval(checkReminderNotifications, 60 * 60 * 1000); // Her saat
    const dailyInterval = setInterval(checkDailyNotifications, 5 * 60 * 1000); // Her 5 dakika
    const medicationInterval = setInterval(checkMedicationNotifications, 2 * 60 * 1000); // Her 2 dakika (ilaç için daha hassas)

    return () => {
      clearInterval(reminderInterval);
      clearInterval(dailyInterval);
      clearInterval(medicationInterval);
    };
  }, [checkReminderNotifications, checkDailyNotifications, checkMedicationNotifications, checkStartupNotifications]);

  return { requestPermission, showNotification, isElectron };
}