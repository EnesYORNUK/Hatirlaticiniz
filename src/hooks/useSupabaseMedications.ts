import { useState, useEffect, useCallback } from 'react';
import { Medication, MedicationLog, DailyMedicationSchedule, MedicationStats } from '../types/medication';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSupabaseMedications() {
  const { user, isAuthenticated } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Supabase row to Medication type
  const convertRowToMedication = (row: any): Medication => ({
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    time: row.time,
    weekDay: row.week_day,
    monthDay: row.month_day,
    isActive: row.is_active,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    createdAt: row.created_at,
    createdBy: row.created_by
  });

  // Convert Medication to Supabase insert format
  const convertMedicationToInsert = (medication: Omit<Medication, 'id' | 'createdAt'>): any => ({
    user_id: user?.id,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    time: medication.time,
    week_day: medication.weekDay,
    month_day: medication.monthDay,
    is_active: medication.isActive,
    start_date: medication.startDate,
    end_date: medication.endDate,
    notes: medication.notes,
    created_by: medication.createdBy
  });

  // Convert Supabase row to MedicationLog type
  const convertRowToMedicationLog = (row: any): MedicationLog => ({
    id: row.id,
    medicationId: row.medication_id,
    takenAt: row.taken_at,
    scheduledTime: row.scheduled_time,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at
  });

  // Convert MedicationLog to Supabase insert format
  const convertMedicationLogToInsert = (log: Omit<MedicationLog, 'id' | 'createdAt'>): any => ({
    user_id: user?.id,
    medication_id: log.medicationId,
    taken_at: log.takenAt,
    scheduled_time: log.scheduledTime,
    status: log.status,
    notes: log.notes
  });

  // Load medications from Supabase
  const loadMedications = async () => {
    if (!user || !isAuthenticated) {
      setMedications([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const convertedMedications = data?.map(convertRowToMedication) || [];
      setMedications(convertedMedications);
      console.log(`✅ ${convertedMedications.length} ilaç Supabase'den yüklendi`);
    } catch (err: any) {
      console.error('❌ İlaçlar yüklenemedi:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load medication logs from Supabase
  const loadMedicationLogs = async () => {
    if (!user || !isAuthenticated) {
      setMedicationLogs([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false });

      if (error) {
        throw error;
      }

      const convertedLogs = data?.map(convertRowToMedicationLog) || [];
      setMedicationLogs(convertedLogs);
      console.log(`✅ ${convertedLogs.length} ilaç logu yüklendi`);
    } catch (err: any) {
      console.error('❌ İlaç logları yüklenemedi:', err);
      setError(err.message);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadMedications();
      loadMedicationLogs();
    } else {
      setMedications([]);
      setMedicationLogs([]);
    }
  }, [user, isAuthenticated]);

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
          return med.weekDay === dayOfWeek;
        case 'monthly':
          return med.monthDay === dayOfMonth;
        default:
          return false;
      }
    });

    const medicationsWithStatus = dailyMedications.map(medication => {
      const log = medicationLogs.find(log => 
        log.medicationId === medication.id &&
        log.takenAt.split('T')[0] === date
      );

      return {
        medication,
        scheduledTime: medication.time,
        log,
        status: log ? log.status : 'pending' as const
      };
    });

    return {
      date,
      medications: medicationsWithStatus
    };
  }, [medications, medicationLogs]);

  // Bugünkü programı getir
  const getTodaySchedule = () => {
    return getDailySchedule(getTodayString());
  };

  // Add new medication
  const addMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const insertData = convertMedicationToInsert(medicationData);
      const { data, error } = await supabase
        .from('medications')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newMedication = convertRowToMedication(data);
      setMedications(prev => [newMedication, ...prev]);
      console.log('✅ Yeni ilaç eklendi:', newMedication.id);
      return true;
    } catch (err: any) {
      console.error('❌ İlaç eklenemedi:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update medication
  const updateMedication = async (id: string, updates: Partial<Medication>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.dosage !== undefined) updateData.dosage = updates.dosage;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
      if (updates.time !== undefined) updateData.time = updates.time;
      if (updates.weekDay !== undefined) updateData.week_day = updates.weekDay;
      if (updates.monthDay !== undefined) updateData.month_day = updates.monthDay;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.createdBy !== undefined) updateData.created_by = updates.createdBy;

      // @ts-ignore - Supabase typing issue
      const { data, error } = await supabase
        .from('medications')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedMedication = convertRowToMedication(data);
      setMedications(prev => prev.map(med => med.id === id ? updatedMedication : med));
      console.log('✅ İlaç güncellendi:', id);
      return true;
    } catch (err: any) {
      console.error('❌ İlaç güncellenemedi:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete medication
  const deleteMedication = async (id: string): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      // First delete all logs for this medication
      await supabase
        .from('medication_logs')
        .delete()
        .eq('medication_id', id)
        .eq('user_id', user.id);

      // Then delete the medication
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setMedications(prev => prev.filter(med => med.id !== id));
      setMedicationLogs(prev => prev.filter(log => log.medicationId !== id));
      console.log('✅ İlaç silindi:', id);
      return true;
    } catch (err: any) {
      console.error('❌ İlaç silinemedi:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark medication as taken
  const markMedicationTaken = async (medicationId: string, status: 'taken' | 'missed' | 'skipped', notes?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const now = new Date();
      const medication = medications.find(m => m.id === medicationId);
      if (!medication) return false;

      const logData = convertMedicationLogToInsert({
        medicationId,
        takenAt: now.toISOString(),
        scheduledTime: medication.time,
        status,
        notes: notes || ''
      });

      const { data, error } = await supabase
        .from('medication_logs')
        .insert(logData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newLog = convertRowToMedicationLog(data);
      setMedicationLogs(prev => [newLog, ...prev]);
      console.log('✅ İlaç durumu kaydedildi:', medicationId, status);
      return true;
    } catch (err: any) {
      console.error('❌ İlaç durumu kaydedilemedi:', err);
      setError(err.message);
      return false;
    }
  };

  // Migration function to import localStorage data
  const migrateFromLocalStorage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Migrate medications
      const localMedications = localStorage.getItem('medications');
      const localMedicationLogs = localStorage.getItem('medication-logs');
      
      let medicationCount = 0;
      let logCount = 0;

      if (localMedications) {
        const parsedMedications: Medication[] = JSON.parse(localMedications);
        console.log(`🔄 ${parsedMedications.length} ilaç localStorage'dan migrate ediliyor...`);

        for (const medication of parsedMedications) {
          const insertData = convertMedicationToInsert(medication);
          await supabase.from('medications').insert(insertData);
          medicationCount++;
        }
      }

      if (localMedicationLogs) {
        const parsedLogs: MedicationLog[] = JSON.parse(localMedicationLogs);
        console.log(`🔄 ${parsedLogs.length} ilaç logu localStorage'dan migrate ediliyor...`);

        for (const log of parsedLogs) {
          const insertData = convertMedicationLogToInsert(log);
          await supabase.from('medication_logs').insert(insertData);
          logCount++;
        }
      }

      // Clear localStorage after successful migration
      if (medicationCount > 0) {
        localStorage.removeItem('medications');
        console.log(`✅ ${medicationCount} ilaç başarıyla migrate edildi`);
      }
      
      if (logCount > 0) {
        localStorage.removeItem('medication-logs');
        console.log(`✅ ${logCount} ilaç logu başarıyla migrate edildi`);
      }
      
      // Reload data from Supabase
      await loadMedications();
      await loadMedicationLogs();
      return true;
    } catch (err: any) {
      console.error('❌ Medication migration hatası:', err);
      setError(`Medication migration hatası: ${err.message}`);
      return false;
    }
  };

  return {
    medications,
    medicationLogs,
    isLoading,
    error,
    getTodaySchedule,
    getDailySchedule,
    addMedication,
    updateMedication,
    deleteMedication,
    markMedicationTaken,
    migrateFromLocalStorage,
    refreshMedications: loadMedications
  };
}