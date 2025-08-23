import { useState, useEffect, useCallback } from 'react';
import { Medication, MedicationLog, DailyMedicationSchedule, MedicationStats } from '../types/medication';
import { useLocalStorage } from './useLocalStorage';

export function useMedications() {
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', []);
  const [medicationLogs, setMedicationLogs] = useLocalStorage<MedicationLog[]>('medication-logs', []);

  // Bugünün tarihini al
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Belirli bir gün için hap programını oluştur
  const getDailySchedule = useCallback((date: string): DailyMedicationSchedule => {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0=Pazar, 1=Pazartesi...
    const dayOfMonth = targetDate.getDate();
    
    const dailyMedications = medications.filter(med => {
      if (!med.isActive) return false;
      
      // Başlangıç tarihinden önce mi?
      if (targetDate < new Date(med.startDate)) return false;
      
      // Bitiş tarihinden sonra mı?
      if (med.endDate && targetDate > new Date(med.endDate)) return false;
      
      // Sıklığa göre kontrol
      switch (med.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          // Haftalık: weekDay 1=Pazartesi, 7=Pazar -> dayOfWeek 0=Pazar, 1=Pazartesi
          const targetDay = med.weekDay === 7 ? 0 : med.weekDay;
          return dayOfWeek === targetDay;
        case 'monthly':
          return dayOfMonth === med.monthDay;
        default:
          return false;
      }
    });

    const medicationSchedule = dailyMedications.map(medication => {
      // Bu hap için bugünün logunu bul
      const log = medicationLogs.find(log => 
        log.medicationId === medication.id && 
        log.takenAt.startsWith(date)
      );

      const scheduledTime = medication.time;
      const status: 'pending' | 'taken' | 'missed' | 'skipped' = log ? log.status : 'pending';

      return {
        medication,
        scheduledTime,
        log,
        status
      };
    });

    return {
      date,
      medications: medicationSchedule
    };
  }, [medications, medicationLogs]);

  // Bugünün programını al
  const getTodaySchedule = useCallback(() => {
    return getDailySchedule(getTodayString());
  }, [getDailySchedule]);

  // Hap ekle
  const addMedication = useCallback(async (medicationData: Omit<Medication, 'id' | 'createdAt'>) => {
    const newMedication: Medication = {
      ...medicationData,
      id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    await setMedications(prev => [...prev, newMedication]);
    return newMedication;
  }, [setMedications]);

  // Hap güncelle
  const updateMedication = useCallback(async (id: string, updates: Partial<Medication>) => {
    await setMedications(prev => 
      prev.map(med => med.id === id ? { ...med, ...updates } : med)
    );
  }, [setMedications]);

  // Hap sil
  const deleteMedication = useCallback(async (id: string) => {
    await setMedications(prev => prev.filter(med => med.id !== id));
    // İlgili logları da sil
    await setMedicationLogs(prev => prev.filter(log => log.medicationId !== id));
  }, [setMedications, setMedicationLogs]);

  // Hap alındığını işaretle
  const markMedicationTaken = useCallback(async (
    medicationId: string, 
    status: 'taken' | 'missed' | 'skipped',
    notes?: string
  ) => {
    const now = new Date();
    const medication = medications.find(m => m.id === medicationId);
    
    if (!medication) return;

    // Mevcut log varsa güncelle, yoksa yeni oluştur
    const todayString = getTodayString();
    const existingLogIndex = medicationLogs.findIndex(log => 
      log.medicationId === medicationId && 
      log.takenAt.startsWith(todayString)
    );

    const logData: MedicationLog = {
      id: existingLogIndex >= 0 ? medicationLogs[existingLogIndex].id : `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      medicationId,
      takenAt: now.toISOString(),
      scheduledTime: medication.time,
      status,
      notes,
      createdAt: existingLogIndex >= 0 ? medicationLogs[existingLogIndex].createdAt : now.toISOString(),
    };

    if (existingLogIndex >= 0) {
      // Mevcut logu güncelle
      await setMedicationLogs(prev => 
        prev.map((log, index) => index === existingLogIndex ? logData : log)
      );
    } else {
      // Yeni log ekle
      await setMedicationLogs(prev => [...prev, logData]);
    }
  }, [medications, medicationLogs, setMedicationLogs]);

  // İstatistikleri hesapla
  const getStats = useCallback((): MedicationStats => {
    const today = getTodayString();
    const todaySchedule = getTodaySchedule();
    
    // Bu hafta - Pazartesi başlangıç
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Pazartesi
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Pazar
    weekEnd.setHours(23, 59, 59, 999);

    // Bu ay
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Haftalık ve aylık compliance hesapla
    const weeklyLogs = medicationLogs.filter(log => {
      const logDate = new Date(log.takenAt);
      return logDate >= weekStart && logDate <= weekEnd;
    });

    const monthlyLogs = medicationLogs.filter(log => {
      const logDate = new Date(log.takenAt);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    const weeklyTaken = weeklyLogs.filter(log => log.status === 'taken').length;
    const weeklyTotal = weeklyLogs.length;
    const monthlyTaken = monthlyLogs.filter(log => log.status === 'taken').length;
    const monthlyTotal = monthlyLogs.length;

    return {
      totalMedications: medications.length,
      activeMedications: medications.filter(m => m.isActive).length,
      todayCount: todaySchedule.medications.length,
      takenToday: todaySchedule.medications.filter(m => m.status === 'taken').length,
      missedToday: todaySchedule.medications.filter(m => m.status === 'missed').length,
      weeklyCompliance: weeklyTotal > 0 ? Math.round((weeklyTaken / weeklyTotal) * 100) : 0,
      monthlyCompliance: monthlyTotal > 0 ? Math.round((monthlyTaken / monthlyTotal) * 100) : 0,
    };
  }, [medications, medicationLogs, getTodaySchedule]);

  // Yaklaşan hapları al (gelecek 2 saat içinde)
  const getUpcomingMedications = useCallback(() => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const todaySchedule = getTodaySchedule();

    return todaySchedule.medications.filter(item => {
      if (item.status !== 'pending') return false;
      
      const scheduledDateTime = new Date(`${getTodayString()}T${item.scheduledTime}`);
      return scheduledDateTime >= now && scheduledDateTime <= twoHoursLater;
    });
  }, [getTodaySchedule]);

  // Geciken hapları al
  const getMissedMedications = useCallback(() => {
    const now = new Date();
    const todaySchedule = getTodaySchedule();

    return todaySchedule.medications.filter(item => {
      if (item.status !== 'pending') return false;
      
      const scheduledDateTime = new Date(`${getTodayString()}T${item.scheduledTime}`);
      return scheduledDateTime < now;
    });
  }, [getTodaySchedule]);

  return {
    // Data
    medications,
    medicationLogs,
    
    // Computed
    getTodaySchedule,
    getDailySchedule,
    getStats,
    getUpcomingMedications,
    getMissedMedications,
    
    // Actions
    addMedication,
    updateMedication,
    deleteMedication,
    markMedicationTaken,
  };
}