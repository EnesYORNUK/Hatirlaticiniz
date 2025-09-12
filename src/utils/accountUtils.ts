import { supabase } from '../lib/supabase';

export const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Use a single SQL command to delete all user data
    // This will be more efficient and handle foreign key constraints properly
    const { error } = await supabase.rpc('delete_user_data', {
      user_id: userId
    });

    if (error) {
      throw new Error(`Failed to delete user data: ${error.message}`);
    }

    // Sign out the user
    await supabase.auth.signOut();

    console.log('✅ User account and data successfully deleted');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error deleting user account:', error);
    return { success: false, error: error.message };
  }
};