import { useState, useEffect, useCallback } from 'react';
import { Medication, MedicationLog } from '../types/medication';
import { supabase, SupabaseUpdate } from '../lib/supabase';
import { useAuth } from './useAuth';

// Define MedicationScheduleItem type
interface MedicationScheduleItem {
  medication: Medication;
  scheduledTime: string;
  log?: MedicationLog;
  status: string;
}

export function useSupabaseMedications() {
  const { user, isAuthenticated } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Supabase row to Medication type
  const convertRowToMedication = useCallback((row: Record<string, unknown>): Medication => ({
    id: row.id as string,
    name: row.name as string,
    dosage: row.dosage as string,
    frequency: row.frequency as "daily" | "weekly" | "monthly",
    time: row.time as string,
    weekDay: row.week_day as number | undefined,
    monthDay: row.month_day as number | undefined,
    isActive: row.is_active as boolean,
    startDate: row.start_date as string,
    endDate: row.end_date as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    createdBy: row.created_by as string
  }), []);

  // Convert Medication to Supabase insert format
  const convertMedicationToInsert = useCallback((medication: Omit<Medication, 'id' | 'createdAt'>): Record<string, unknown> => ({
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
  }), [user]);

  // Convert Supabase row to MedicationLog type
  const convertRowToMedicationLog = useCallback((row: Record<string, unknown>): MedicationLog => ({
    id: row.id as string,
    medicationId: row.medication_id as string,
    takenAt: row.taken_at as string,
    scheduledTime: row.scheduled_time as string,
    status: row.status as "taken" | "missed" | "skipped",
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string
  }), []);

  // Convert MedicationLog to Supabase insert format
  const convertMedicationLogToInsert = useCallback((log: Omit<MedicationLog, 'id' | 'createdAt'>): Record<string, unknown> => ({
    user_id: user?.id,
    medication_id: log.medicationId,
    taken_at: log.takenAt,
    scheduled_time: log.scheduledTime,
    status: log.status,
    notes: log.notes
  }), [user]);

  // Load medications from Supabase
  const loadMedications = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setMedications([]);
      return;
    }

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      setIsLoading(false);
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
    } catch (err: unknown) {
      console.error('❌ İlaçlar yüklenemedi:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, convertRowToMedication]);

  // Load medication logs from Supabase
  const loadMedicationLogs = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setMedicationLogs([]);
      return;
    }

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
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
    } catch (err: unknown) {
      console.error('❌ İlaç logları yüklenemedi:', err);
      setError((err as Error).message);
    }
  }, [user, isAuthenticated, convertRowToMedicationLog]);

  // Load data when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadMedications();
      loadMedicationLogs();
    } else {
      setMedications([]);
      setMedicationLogs([]);
    }
  }, [user, isAuthenticated, loadMedications, loadMedicationLogs]);

  // Get today's medication schedule
  const getDailySchedule = useCallback((date: Date = new Date()): MedicationScheduleItem[] => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = date.getDate();
    
    return medications
      .filter(medication => {
        if (!medication.isActive) return false;
        
        // Check if medication should be taken today based on frequency
        if (medication.frequency === 'daily') {
          return true;
        } else if (medication.frequency === 'weekly' && medication.weekDay !== undefined) {
          // Haftalık: weekDay 1=Pazartesi, 7=Pazar -> dayOfWeek 0=Pazar, 1=Pazartesi
          const targetDay = medication.weekDay === 7 ? 0 : medication.weekDay;
          return dayOfWeek === targetDay;
        } else if (medication.frequency === 'monthly' && medication.monthDay !== undefined) {
          return dayOfMonth === medication.monthDay;
        }
        
        return false;
      })
      .map(medication => {
        // Find existing log for today
        const todayStr = date.toISOString().split('T')[0];
        const log = medicationLogs.find(l => 
          l.medicationId === medication.id && 
          l.scheduledTime.startsWith(todayStr)
        );
        
        return {
          medication,
          scheduledTime: medication.time,
          log,
          status: log?.status || 'pending'
        };
      });
  }, [medications, medicationLogs]);

  // Bugünkü programı getir
  const getTodaySchedule = useCallback(() => {
    return getDailySchedule(new Date());
  }, [getDailySchedule]);

  // Add new medication
  const addMedication = useCallback(async (medicationData: Omit<Medication, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const insertData = convertMedicationToInsert(medicationData);
      const { data, error } = await supabase
        .from('medications')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newMedication = convertRowToMedication(data);
      setMedications(prev => [newMedication, ...prev]);
      console.log('✅ Yeni ilaç eklendi:', newMedication.id);
      return true;
    } catch (err: unknown) {
      console.error('❌ İlaç eklenemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, convertMedicationToInsert, convertRowToMedication]);

  // Update medication
  const updateMedication = useCallback(async (id: string, updates: Partial<Medication>): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: SupabaseUpdate<'medications'> = {};
      
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
    } catch (err: unknown) {
      console.error('❌ İlaç güncellenemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, convertRowToMedication]);

  // Delete medication
  const deleteMedication = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

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
    } catch (err: unknown) {
      console.error('❌ İlaç silinemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mark medication as taken
  const markMedicationTaken = useCallback(async (medicationId: string, status: 'taken' | 'missed' | 'skipped', notes?: string): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    try {
      const now = new Date();
      const medication = medications.find(m => m.id === medicationId);
      if (!medication) return false;

      // scheduled_time değerini bugünün tarihi ve ilaç saati ile ISO timestamp olarak oluştur
      const [hourStr, minuteStr] = (medication.time || '').split(':');
      const hour = parseInt(hourStr ?? '0', 10);
      const minute = parseInt(minuteStr ?? '0', 10);
      const scheduledDate = new Date(now);
      scheduledDate.setHours(isNaN(hour) ? 0 : hour, isNaN(minute) ? 0 : minute, 0, 0);
      const scheduledIso = scheduledDate.toISOString();

      const logData = convertMedicationLogToInsert({
        medicationId,
        takenAt: now.toISOString(),
        scheduledTime: scheduledIso,
        status,
        notes: notes || ''
      });

      const { data, error } = await supabase
        .from('medication_logs')
        .insert(logData as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newLog = convertRowToMedicationLog(data);
      setMedicationLogs(prev => [newLog, ...prev]);
      console.log('✅ İlaç durumu kaydedildi:', medicationId, status);
      return true;
    } catch (err: unknown) {
      console.error('❌ İlaç durumu kaydedilemedi:', err);
      setError((err as Error).message);
      return false;
    }
  }, [user, medications, convertMedicationLogToInsert, convertRowToMedicationLog]);

  // Migration function to import localStorage data
  const migrateFromLocalStorage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

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
          await supabase!.from('medications').insert(insertData as any);
          medicationCount++;
        }
      }

      if (localMedicationLogs) {
        const parsedLogs: MedicationLog[] = JSON.parse(localMedicationLogs);
        console.log(`🔄 ${parsedLogs.length} ilaç logu localStorage'dan migrate ediliyor...`);

        for (const log of parsedLogs) {
          const insertData = convertMedicationLogToInsert(log);
          await supabase!.from('medication_logs').insert(insertData as any);
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
    } catch (err: unknown) {
      console.error('❌ Medication migration hatası:', err);
      setError(`Medication migration hatası: ${(err as Error).message}`);
      return false;
    }
  }, [user, convertMedicationToInsert, convertMedicationLogToInsert, loadMedications, loadMedicationLogs]);

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