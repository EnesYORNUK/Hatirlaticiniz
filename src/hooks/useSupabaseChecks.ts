import { useState, useEffect } from 'react';
import { Check } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSupabaseChecks() {
  const { user, isAuthenticated } = useAuth();
  const [checks, setChecks] = useState<Check[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Supabase row to Check type
  const convertRowToCheck = (row: any): Check => ({
    id: row.id,
    createdDate: row.created_date,
    paymentDate: row.payment_date,
    amount: row.amount,
    createdBy: row.created_by,
    signedTo: row.signed_to,
    isPaid: row.is_paid,
    createdAt: row.created_at,
    type: row.type,
    billType: row.bill_type,
    customBillType: row.custom_bill_type,
    isRecurring: row.is_recurring,
    recurringType: row.recurring_type,
    recurringDay: row.recurring_day,
    nextPaymentDate: row.next_payment_date
  });

  // Convert Check to Supabase insert format
  const convertCheckToInsert = (check: Omit<Check, 'id' | 'createdAt'>): any => ({
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
  });

  // Load checks from Supabase
  const loadChecks = async () => {
    if (!user || !isAuthenticated) {
      setChecks([]);
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
    } catch (err: any) {
      console.error('❌ Çekler yüklenemedi:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load checks when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadChecks();
    } else {
      setChecks([]);
    }
  }, [user, isAuthenticated]);

  // Add new check
  const addCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const insertData = convertCheckToInsert(checkData);
      const { data, error } = await supabase
        .from('checks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCheck = convertRowToCheck(data);
      setChecks(prev => [newCheck, ...prev]);
      console.log('✅ Yeni çek eklendi:', newCheck.id);
      return true;
    } catch (err: any) {
      console.error('❌ Çek eklenemedi:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update check
  const updateCheck = async (id: string, updates: Partial<Check>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      
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

      // @ts-ignore - Supabase typing issue
      const { data, error } = await supabase
        .from('checks')
        .update(updateData)
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
    } catch (err: any) {
      console.error('❌ Çek güncellenemedi:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete check
  const deleteCheck = async (id: string): Promise<boolean> => {
    if (!user) return false;

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
    } catch (err: any) {
      console.error('❌ Çek silinemedi:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle paid status
  const togglePaid = async (id: string): Promise<boolean> => {
    const check = checks.find(c => c.id === id);
    if (!check) return false;

    return await updateCheck(id, { isPaid: !check.isPaid });
  };

  // Migration function to import localStorage data
  const migrateFromLocalStorage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const localChecks = localStorage.getItem('checks');
      if (!localChecks) return true; // No data to migrate

      const parsedChecks: Check[] = JSON.parse(localChecks);
      console.log(`🔄 ${parsedChecks.length} çek localStorage'dan migrate ediliyor...`);

      for (const check of parsedChecks) {
        const insertData = convertCheckToInsert(check);
        await supabase.from('checks').insert(insertData);
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('checks');
      console.log('✅ Çekler başarıyla migrate edildi ve localStorage temizlendi');
      
      // Reload data from Supabase
      await loadChecks();
      return true;
    } catch (err: any) {
      console.error('❌ Migration hatası:', err);
      setError(`Migration hatası: ${err.message}`);
      return false;
    }
  };

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