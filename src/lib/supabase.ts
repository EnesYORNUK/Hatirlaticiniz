import { createClient } from '@supabase/supabase-js'
import { Check, Settings, NotificationHistory } from '../types'
import { Medication, MedicationLog } from '../types/medication'

// MCP-optimized Supabase client configuration

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string
          updated_at?: string
        }
      }
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
      user_settings: {
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
  }
}

// Use environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://asbcteplixnkuqvytqce.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYmN0ZXBsaXhua3Vxdnl0cWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjIxMjYsImV4cCI6MjA3MzA5ODEyNn0.ysyedceXwi5KpRGordwG0uucIHRFFBA6fHuYhs_Lq5U'

// Create Supabase client with error handling and MCP support
let supabaseInstance: ReturnType<typeof createClient> | null = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'Hatirlaticiniz/2.0.8'
      }
    },
    // MCP optimization settings
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    db: {
      schema: 'public'
    }
  });
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  supabaseInstance = null;
}

export const supabase = supabaseInstance;

// Type-safe table references
export type SupabaseTable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type SupabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type SupabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type SupabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export default supabase