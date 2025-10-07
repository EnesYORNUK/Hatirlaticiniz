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
let warnedMissingConfig = false;
let cleanedStaleTokens = false;

function clearStaleSupabaseAuthTokens() {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      // Supabase JS v2 default storage key pattern: sb-<project-ref>-auth-token
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          const hasRefreshToken = Boolean(
            parsed?.currentSession?.refresh_token ||
            parsed?.session?.refresh_token ||
            parsed?.refresh_token
          );
          if (!hasRefreshToken) {
            keysToRemove.push(key);
          }
        } catch {
          // Malformed value -> remove
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    if (keysToRemove.length && import.meta.env.DEV) {
      console.log(`🧹 ${keysToRemove.length} adet geçersiz Supabase oturum anahtarı temizlendi`);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('⚠️ Supabase token temizleme başarısız', e);
  } finally {
    cleanedStaleTokens = true;
  }
}

async function initializeSupabase() {
  if (supabase) {
    return supabase;
  }

  try {
    const debug = import.meta.env?.DEV;
    const electronConfig = (typeof window !== 'undefined' && (window as any).electronAPI)
      ? (window as any).electronAPI.supabaseConfig
      : undefined;

    const normalize = (val: any) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val !== 'string') return val;
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') return undefined;
      return trimmed;
    };

    const electronUrl = electronConfig ? normalize((electronConfig as any).url || (electronConfig as any).supabaseUrl) : undefined;
    const electronAnon = electronConfig ? normalize((electronConfig as any).anonKey || (electronConfig as any).supabaseAnonKey) : undefined;
    const envUrl = normalize(import.meta.env.VITE_SUPABASE_URL);
    const envAnon = normalize(import.meta.env.VITE_SUPABASE_ANON_KEY);

    const url = electronUrl || envUrl;
    const anonKey = electronAnon || envAnon;

    if (electronConfig && debug) {
      console.log('Supabase config from electronAPI:', {
        hasUrl: Boolean(electronUrl),
        hasAnonKey: Boolean(electronAnon)
      });
    }
    if (debug) console.log('Supabase config from env define:', { hasUrl: Boolean(envUrl), hasAnonKey: Boolean(envAnon) });

    if (url && anonKey) {
      // Prevent Supabase from attempting a refresh with broken/missing tokens on startup
      if (!cleanedStaleTokens) clearStaleSupabaseAuthTokens();
      supabase = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
      if (debug) console.log('Supabase client created successfully');
    } else {
      if (!warnedMissingConfig) {
        console.error('Supabase configuration is missing. URL or anonKey not found.');
        warnedMissingConfig = true;
      }
      return null;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return null;
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