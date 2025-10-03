import { createClient } from '@supabase/supabase-js';

// Custom storage adapter for Electron
const electronStore = {
  getItem: async (key: string) => {
    return window.electronAPI?.getSession(key);
  },
  setItem: async (key: string, value: string) => {
    window.electronAPI?.setSession(key, value);
  },
  removeItem: async (key: string) => {
    window.electronAPI?.deleteSession(key);
  },
};

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

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('🔍 Supabase env check:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl?.substring(0, 30) + '...' 
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Running in offline mode.');
  console.warn('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: window.electronAPI ? electronStore : undefined,
      }
    })
  : null;

// Type exports for better type safety
export type SupabaseTable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type SupabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type SupabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type SupabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export default supabase