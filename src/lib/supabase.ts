// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          email?: string;
        };
        Insert: {
          id: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          email?: string;
        };
        Update: {
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          email?: string;
        };
      };
      checks: {
        Row: {
          id: string
          user_id: string
          created_date: string
          payment_date: string
          amount: number
          created_by: string
          signed_to: string
          is_paid: boolean
          type: 'check' | 'bill'
          bill_type?: string
          custom_bill_type?: string
          is_recurring: boolean
          recurring_type?: 'monthly' | 'weekly' | 'yearly'
          recurring_day?: number
          next_payment_date?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_date: string
          payment_date: string
          amount: number
          created_by: string
          signed_to: string
          is_paid?: boolean
          type: 'check' | 'bill'
          bill_type?: string
          custom_bill_type?: string
          is_recurring?: boolean
          recurring_type?: 'monthly' | 'weekly' | 'yearly'
          recurring_day?: number
          next_payment_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          created_date?: string
          payment_date?: string
          amount?: number
          created_by?: string
          signed_to?: string
          is_paid?: boolean
          type?: 'check' | 'bill'
          bill_type?: string
          custom_bill_type?: string
          is_recurring?: boolean
          recurring_type?: 'monthly' | 'weekly' | 'yearly'
          recurring_day?: number
          next_payment_date?: string
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string
          frequency: 'daily' | 'weekly' | 'monthly'
          time: string
          week_day?: number
          month_day?: number
          is_active: boolean
          start_date: string
          end_date?: string
          notes?: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage: string
          frequency: 'daily' | 'weekly' | 'monthly'
          time: string
          week_day?: number
          month_day?: number
          is_active?: boolean
          start_date: string
          end_date?: string
          notes?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          dosage?: string
          frequency?: 'daily' | 'weekly' | 'monthly'
          time?: string
          week_day?: number
          month_day?: number
          is_active?: boolean
          start_date?: string
          end_date?: string
          notes?: string
          created_by?: string
          updated_at?: string
        }
      }
      medication_logs: {
        Row: {
          id: string
          user_id: string
          medication_id: string
          taken_at: string
          scheduled_time: string
          status: 'taken' | 'missed' | 'skipped'
          notes?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          medication_id: string
          taken_at: string
          scheduled_time: string
          status: 'taken' | 'missed' | 'skipped'
          notes?: string
          created_at?: string
        }
        Update: {
          taken_at?: string
          scheduled_time?: string
          status?: 'taken' | 'missed' | 'skipped'
          notes?: string
        }
      }
      app_user_settings: {
        Row: {
          id: string
          user_id: string
          reminder_days: number
          notifications_enabled: boolean
          auto_update_enabled: boolean
          daily_notification_enabled: boolean
          daily_notification_time: string
          last_notification_check: string
          telegram_bot_enabled: boolean
          telegram_bot_token: string
          telegram_chat_id: string
          theme: string
          medication_notifications_enabled: boolean
          medication_reminder_minutes: number
          show_medications_in_dashboard: boolean
          medication_sound_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reminder_days?: number
          notifications_enabled?: boolean
          auto_update_enabled?: boolean
          daily_notification_enabled?: boolean
          daily_notification_time?: string
          last_notification_check?: string
          telegram_bot_enabled?: boolean
          telegram_bot_token?: string
          telegram_chat_id?: string
          theme?: string
          medication_notifications_enabled?: boolean
          medication_reminder_minutes?: number
          show_medications_in_dashboard?: boolean
          medication_sound_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          reminder_days?: number
          notifications_enabled?: boolean
          auto_update_enabled?: boolean
          daily_notification_enabled?: boolean
          daily_notification_time?: string
          last_notification_check?: string
          telegram_bot_enabled?: boolean
          telegram_bot_token?: string
          telegram_chat_id?: string
          theme?: string
          medication_notifications_enabled?: boolean
          medication_reminder_minutes?: number
          show_medications_in_dashboard?: boolean
          medication_sound_enabled?: boolean
          updated_at?: string
        }
      }
    }
    Functions: {
      delete_user_data: {
        Args: { user_id: string }
        Returns: void
      }
    }
  }
}



import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

async function initializeSupabase() {
  if (supabase) {
    return supabase;
  }

  try {
    let config;
    
    // Check if running in Electron environment
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.getSupabaseConfig) {
      config = await window.electronAPI.getSupabaseConfig();
    } else {
      // Fallback for web environment - use environment variables
      config = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      };
    }
    
    if (config && config.supabaseUrl && config.supabaseAnonKey) {
      supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      console.log('Supabase client created successfully');
    } else {
      console.error('Supabase configuration is missing.');
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }

  return supabase;
}

// Initialize Supabase asynchronously


export { supabase, initializeSupabase };

// Type exports for better type safety
export type SupabaseTable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type SupabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type SupabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type SupabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export default supabase