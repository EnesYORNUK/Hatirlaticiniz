import { supabase, initializeSupabase } from '../lib/supabase';

export const formatCurrency = (amount: number | string): string => {
  const num = Number(amount);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(num);
};

export const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await initializeSupabase(); // Ensure Supabase is initialized
    // Guard: Supabase offline/null ise işlemi iptal et
    if (!supabase) {
      return { success: false, error: 'Veri servisi kullanılamıyor' };
    }

    // Use a single SQL command to delete all user data
    // This will be more efficient and handle foreign key constraints properly
    const { error } = await supabase.rpc('delete_user_data', {
      user_id: userId
    } as any);

    if (error) {
      throw new Error(`Failed to delete user data: ${error.message}`);
    }

    // Sign out the user
    await supabase.auth.signOut();

    console.log('✅ User account and data successfully deleted');
    return { success: true };

  } catch (error: unknown) {
    console.error('❌ Error deleting user account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};