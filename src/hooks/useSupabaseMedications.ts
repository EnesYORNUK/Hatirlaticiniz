import { useState, useEffect, useCallback } from 'react';
import { supabase, initializeSupabase } from '../lib/supabase'; // Import supabase client
import { useAuth } from './useAuth';
import { Medication, MedicationLog, MedicationScheduleItem } from '../types/medication';
import { Database } from '../types/supabase-mcp';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Supabase'den gelen Medication ve MedicationLog türlerini yerel türlerimizle eşleştir
type MedicationRow = Tables<'medications'>;
type MedicationLogRow = Tables<'medication_logs'>;

function fromMedicationRow(row: MedicationRow): Medication {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
    time: row.time,
    weekDay: row.week_day ?? undefined,
    monthDay: row.month_day ?? undefined,
    isActive: row.is_active ?? true,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    notes: row.notes ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromMedicationLogRow(row: MedicationLogRow): MedicationLog {
  return {
    id: row.id,
    medicationId: row.medication_id,
    userId: row.user_id,
    takenAt: row.taken_at,
    scheduledTime: row.scheduled_time,
    status: row.status as 'taken' | 'missed' | 'skipped',
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export const useSupabaseMedications = () => {
  const { user, isAuthenticated } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [medicationsError, setMedicationsError] = useState<string | null>(null);

  useEffect(() => {
    initializeSupabase();
  }, []);

  const fetchMedications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const client = supabase ?? await initializeSupabase();
    if (!client) return;

    setIsLoading(true);
    try {
      // Oturum hazır mı kontrol et
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      const { data, error } = await client
        .from('medications')
        .select('*')
        .order('created_at', { ascending: true })
        .eq('user_id', user.id);

      if (error) throw error;
      // Supabase satırlarını uygulama türlerine dönüştür
      const mapped = (data || []).map(fromMedicationRow);
      setMedications(mapped);
    } catch (err: any) {
      setMedicationsError(err.message);
      console.error("Error loading medications:", err);
    } finally {
      // Güvenli: her yükleme sonunda durumu kapat
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadMedicationLogs = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const client = supabase ?? await initializeSupabase();
    if (!client) return;

    setIsLoading(true);
    try {
      // Oturum hazır mı kontrol et
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      const { data, error } = await client
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setMedicationLogs(data.map(fromMedicationLogRow));
    } catch (err: any) {
      setMedicationsError(err.message);
      console.error("Error loading medication logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMedications();
      loadMedicationLogs();
    }
  }, [isAuthenticated, user, fetchMedications, loadMedicationLogs]);

  const addMedication = async (medication: Omit<Medication, 'id' | 'userId' | 'createdBy' | 'createdAt'>) => {
    if (!user) return null;

    const client = supabase ?? await initializeSupabase();
    if (!client) return null;

    const newMedication: TablesInsert<'medications'> = {
      user_id: user.id,
      created_by: user.email || 'unknown',
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      time: medication.time,
      start_date: medication.startDate,
      week_day: medication.weekDay,
      month_day: medication.monthDay,
      is_active: medication.isActive,
      end_date: medication.endDate,
      notes: medication.notes,
    };

    try {
      setIsLoading(true);
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      const { data, error } = await client
        .from('medications')
        .insert(newMedication as never)
        .select()
        .single();

      if (error) throw error;
      
      const addedMedication = fromMedicationRow(data);
      setMedications(prev => [...prev, addedMedication]);
      return addedMedication;
    } catch (err: any) {
      setMedicationsError(err.message);
      console.error("Error adding medication:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedication = async (id: string, updates: Partial<Omit<Medication, 'id' | 'userId' | 'createdBy' | 'createdAt'>>): Promise<void> => {
    if (!user) return;

    const client = supabase ?? await initializeSupabase();
    if (!client) return;

    const supabaseUpdates: TablesUpdate<'medications'> = {};

    // Map frontend fields to backend columns and handle undefined vs. null
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.dosage !== undefined) supabaseUpdates.dosage = updates.dosage;
    if (updates.frequency !== undefined) supabaseUpdates.frequency = updates.frequency;
    if (updates.time !== undefined) supabaseUpdates.time = updates.time;
    if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
    if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;

    // For nullable fields, explicitly check for hasOwnProperty to differentiate
    // between a key being absent and a key being present with a value of undefined.
    if (updates.hasOwnProperty('weekDay')) supabaseUpdates.week_day = updates.weekDay ?? null;
    if (updates.hasOwnProperty('monthDay')) supabaseUpdates.month_day = updates.monthDay ?? null;
    if (updates.hasOwnProperty('endDate')) supabaseUpdates.end_date = updates.endDate ?? null;
    if (updates.hasOwnProperty('notes')) supabaseUpdates.notes = updates.notes ?? null;


    try {
      setIsLoading(true);
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      const { data, error } = await client
        .from('medications')
        .update(supabaseUpdates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedMedication = fromMedicationRow(data);
      setMedications(prev => prev.map(m => m.id === id ? updatedMedication : m));
    } catch (err: any) {
      setMedicationsError(err.message);
      console.error("Error updating medication:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedication = async (id: string): Promise<void> => {
    if (!user) return;

    const client = supabase ?? await initializeSupabase();
    if (!client) return;

    try {
      setIsLoading(true);
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }

      // Önce ilacı sil (FK CASCADE zaten tanımlı)
      const { error: medError } = await client
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (medError) {
        // FK hatası veya başka bir durum olursa logları silmeyi dene, sonra ilacı sil
        const { error: logError } = await client
          .from('medication_logs')
          .delete()
          .eq('medication_id', id)
          .eq('user_id', user.id);
        if (logError) throw logError;

        const { error: medError2 } = await client
          .from('medications')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (medError2) throw medError2;
      }

      setMedications(prev => prev.filter(m => m.id !== id));
      setMedicationLogs(prev => prev.filter(l => l.medicationId !== id));

    } catch (err: any) {
      setMedicationsError(err.message);
      console.error("Error deleting medication:", err);
    } finally {
      setIsLoading(false);
    }
  };


  const markMedicationTaken = async (medicationId: string, scheduledTime: string, status: 'taken' | 'missed' | 'skipped', notes?: string) => {
    if (!user) return false;

    const client = supabase ?? await initializeSupabase();
    if (!client) return false;

    const logEntry: TablesInsert<'medication_logs'> = {
      medication_id: medicationId,
      user_id: user.id,
      taken_at: new Date().toISOString(),
      scheduled_time: scheduledTime,
      status: status,
      notes: notes,
    };

    try {
      setIsLoading(true);
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      const { data, error } = await client
        .from('medication_logs')
        .insert(logEntry as never)
        .select()
        .single();

      if (error) throw error;

      const newLog = fromMedicationLogRow(data);
      setMedicationLogs(prev => [...prev.filter(l => !(l.medicationId === medicationId && l.scheduledTime === scheduledTime)), newLog]);
      return true;
    } catch (err: any) {
      setMedicationsError(err.message);
      console.error("Error marking medication taken:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const migrateFromLocalStorage = async (localStorageData: { medications: Medication[], medicationLogs: MedicationLog[] }): Promise<boolean> => {
    if (!user) return false;

    try {
      const { medications: localMeds, medicationLogs: localLogs } = localStorageData;

      // Medications
      if (localMeds.length > 0) {
          const client = supabase ?? await initializeSupabase();
          if (!client) return false;
          const newMedications: TablesInsert<'medications'>[] = localMeds.map(m => ({
              user_id: user.id,
              created_by: m.createdBy || user.email || 'unknown',
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              time: m.time,
              start_date: m.startDate,
              week_day: m.weekDay,
              month_day: m.monthDay,
              is_active: m.isActive,
              end_date: m.endDate,
              notes: m.notes,
          }));

          const { error: medError } = await client
              .from('medications')
              .insert(newMedications as never[]);
          if (medError) {
            console.error('Migration error (medications):', medError);
            return false;
          }
      }

      // Medication Logs
      if (localLogs.length > 0) {
          const client = supabase ?? await initializeSupabase();
          if (!client) return false;
          const newLogs: TablesInsert<'medication_logs'>[] = localLogs.map(l => ({
              user_id: user.id,
              medication_id: l.medicationId,
              taken_at: l.takenAt,
              scheduled_time: l.scheduledTime,
              status: l.status,
              notes: l.notes,
          }));
          const { error: logError } = await client
              .from('medication_logs')
              .insert(newLogs as never[]);
          if (logError) {
            console.error('Migration error (logs):', logError);
            return false;
          }
      }

      // Refresh data from supabase
      fetchMedications();
      loadMedicationLogs();
      return true;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  };

  const getDailySchedule = useCallback(
    (date: Date = new Date()): MedicationScheduleItem[] => {
      if (isLoading || medicationsError) {
        return [];
      }
      const schedule: MedicationScheduleItem[] = [];
      const dayOfWeek = date.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
      const dayOfMonth = date.getDate();
      const dateString = date.toISOString().split('T')[0];

      medications.forEach(med => {
        if (!med.isActive) return;

        const startDate = new Date(med.startDate);
        const endDate = med.endDate ? new Date(med.endDate) : null;

        // Tarih kontrolü
        const checkDate = new Date(date); // Gelen tarihi kopyala
        checkDate.setHours(0, 0, 0, 0); // Saati sıfırla

        if (startDate > checkDate) return;
        if (endDate && endDate < checkDate) return;


        let shouldBeTaken = false;
        if (med.frequency === 'daily') {
          shouldBeTaken = true;
        } else if (med.frequency === 'weekly') {
          // JS: Pazar=0, Pzt=1.. Cmt=6 | Supabase: Pzt=1.. Pazar=7
          const jsDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
          if (med.weekDay === jsDayOfWeek) {
            shouldBeTaken = true;
          }
        } else if (med.frequency === 'monthly') {
          if (med.monthDay === dayOfMonth) {
            shouldBeTaken = true;
          }
        }

        if (shouldBeTaken && med.time) {
          const log = medicationLogs.find(l =>
            l.medicationId === med.id &&
            l.scheduledTime === med.time &&
            new Date(l.takenAt).toISOString().split('T')[0] === dateString
          );

          schedule.push({
            medication: med,
            scheduledTime: med.time,
            status: log ? log.status : 'pending',
            log: log,
          });
        }
      });

      return schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    }, [medications, medicationLogs, isLoading, medicationsError]);


  return { 
    medications, 
    medicationLogs, 
    isLoading, 
    medicationsError, 
    addMedication, 
    updateMedication, 
    deleteMedication,
    markMedicationTaken, 
    getDailySchedule,
    migrateFromLocalStorage
  };
}