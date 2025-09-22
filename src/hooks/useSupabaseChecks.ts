import { useCallback, useEffect, useState } from 'react';
import { Check } from '../types';
import { supabase, SupabaseUpdate } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSupabaseChecks() {
  const { user, isAuthenticated } = useAuth();
  const [checks, setChecks] = useState<Check[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Supabase row to Check type
  const convertRowToCheck = useCallback((row: Record<string, unknown>): Check => ({
    id: row.id as string,
    createdDate: row.created_date as string,
    paymentDate: row.payment_date as string,
    amount: row.amount as number,
    createdBy: row.created_by as string,
    signedTo: row.signed_to as string,
    isPaid: row.is_paid as boolean,
    createdAt: row.created_at as string,
    type: row.type as 'check' | 'bill',
    billType: row.bill_type as 'elektrik' | 'su' | 'dogalgaz' | 'telefon' | 'internet' | 'diger' | undefined,
    customBillType: row.custom_bill_type as string | undefined,
    isRecurring: row.is_recurring as boolean,
    recurringType: row.recurring_type as 'monthly' | 'weekly' | 'yearly' | undefined,
    recurringDay: row.recurring_day as number | undefined,
    nextPaymentDate: row.next_payment_date as string | undefined
  }), []);

  // Convert Check to Supabase insert format
  const convertCheckToInsert = useCallback((check: Omit<Check, 'id' | 'createdAt'>): Record<string, unknown> => ({
    user_id: user?.id,
    created_date: check.createdDate,
    payment_date: check.paymentDate,
    amount: check.amount,
    created_by: check.createdBy,
    signed_to: check.signedTo,
    is_paid: check.isPaid,
    type: check.type,
    bill_type: check.billType,
    custom_bill_type: check.customBillType,
    is_recurring: check.isRecurring,
    recurring_type: check.recurringType,
    recurring_day: check.recurringDay,
    next_payment_date: check.nextPaymentDate
  }), [user]);

  // Load checks from Supabase
  const loadChecks = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setChecks([]);
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
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const convertedChecks = data?.map(convertRowToCheck) || [];
      setChecks(convertedChecks);
      console.log(`✅ ${convertedChecks.length} çek Supabase'den yüklendi`);
    } catch (err: unknown) {
      console.error('❌ Çekler yüklenemedi:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, convertRowToCheck]);

  // Load checks when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadChecks();
    } else {
      setChecks([]);
    }
  }, [user, isAuthenticated, loadChecks]);

  // Add new check
  const addCheck = useCallback(async (checkData: Omit<Check, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const insertData = convertCheckToInsert(checkData);
      const { data, error } = await supabase
        .from('checks')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCheck = convertRowToCheck(data);
      setChecks(prev => [newCheck, ...prev]);
      console.log('✅ Yeni çek eklendi:', newCheck.id);
      return true;
    } catch (err: unknown) {
      console.error('❌ Çek eklenemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, convertCheckToInsert, convertRowToCheck]);

  // Update check
  const updateCheck = useCallback(async (id: string, updates: Partial<Check>): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: SupabaseUpdate<'checks'> = {};
      
      if (updates.createdDate !== undefined) updateData.created_date = updates.createdDate;
      if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.createdBy !== undefined) updateData.created_by = updates.createdBy;
      if (updates.signedTo !== undefined) updateData.signed_to = updates.signedTo;
      if (updates.isPaid !== undefined) updateData.is_paid = updates.isPaid;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.billType !== undefined) updateData.bill_type = updates.billType;
      if (updates.customBillType !== undefined) updateData.custom_bill_type = updates.customBillType;
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
      if (updates.recurringType !== undefined) updateData.recurring_type = updates.recurringType;
      if (updates.recurringDay !== undefined) updateData.recurring_day = updates.recurringDay;
      if (updates.nextPaymentDate !== undefined) updateData.next_payment_date = updates.nextPaymentDate;

      const { data, error } = await supabase
        .from('checks')
        .update(updateData as never)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedCheck = convertRowToCheck(data);
      setChecks(prev => prev.map(check => check.id === id ? updatedCheck : check));
      console.log('✅ Çek güncellendi:', id);
      return true;
    } catch (err: unknown) {
      console.error('❌ Çek güncellenemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, convertRowToCheck]);

  // Delete check
  const deleteCheck = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('checks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setChecks(prev => prev.filter(check => check.id !== id));
      console.log('✅ Çek silindi:', id);
      return true;
    } catch (err: unknown) {
      console.error('❌ Çek silinemedi:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle paid status
  const togglePaid = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Supabase guard
    if (!supabase) {
      setError('Veri servisi kullanılamıyor');
      return false;
    }

    try {
      const check = checks.find(c => c.id === id);
      if (!check) return false;

      const { data, error } = await supabase
        .from('checks')
        .update({ is_paid: !check.isPaid } as never)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedCheck = convertRowToCheck(data);
      setChecks(prev => prev.map(c => c.id === id ? updatedCheck : c));
      console.log('✅ Çek ödeme durumu güncellendi:', id);
      return true;
    } catch (err: unknown) {
      console.error('❌ Çek ödeme durumu güncellenemedi:', err);
      setError((err as Error).message);
      return false;
    }
  }, [user, checks, convertRowToCheck]);

  // Migration function to import localStorage data
  const migrateFromLocalStorage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const localChecks = localStorage.getItem('checks');
      if (!localChecks) return true;

      const parsedChecks: Check[] = JSON.parse(localChecks);
      console.log(`🔄 ${parsedChecks.length} çek localStorage'dan migrate ediliyor...`);

      let successCount = 0;
      for (const check of parsedChecks) {
        try {
          const insertData = convertCheckToInsert(check);
          await supabase!.from('checks').insert(insertData as any);
          successCount++;
        } catch (error) {
          console.error('❌ Çek migrate edilemedi:', check.id, error);
        }
      }

      // Clear localStorage after successful migration
      if (successCount > 0) {
        localStorage.removeItem('checks');
        console.log(`✅ ${successCount} çek başarıyla migrate edildi`);
        
        // Reload data from Supabase
        await loadChecks();
      }
      
      return true;
    } catch (err: unknown) {
      console.error('❌ Check migration hatası:', err);
      setError(`Check migration hatası: ${(err as Error).message}`);
      return false;
    }
  }, [user, convertCheckToInsert, loadChecks]);

  return {
    checks,
    isLoading,
    error,
    addCheck,
    updateCheck,
    deleteCheck,
    togglePaid,
    migrateFromLocalStorage,
    refreshChecks: loadChecks
  };
}