export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_user_settings: {
        Row: {
          auto_update_enabled: boolean | null
          auto_delete_after_days: number | null
          created_at: string | null
          daily_notification_enabled: boolean | null
          daily_notification_time: string | null
          id: string
          last_notification_check: string | null
          launch_on_startup: boolean | null
          medication_notifications_enabled: boolean | null
          medication_reminder_minutes: number | null
          medication_sound_enabled: boolean | null
          notifications_enabled: boolean | null
          reminder_days: number | null
          show_medications_in_dashboard: boolean | null
          telegram_bot_enabled: boolean | null
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_update_enabled?: boolean | null
          auto_delete_after_days?: number | null
          created_at?: string | null
          daily_notification_enabled?: boolean | null
          daily_notification_time?: string | null
          id?: string
          last_notification_check?: string | null
          launch_on_startup?: boolean | null
          medication_notifications_enabled?: boolean | null
          medication_reminder_minutes?: number | null
          medication_sound_enabled?: boolean | null
          notifications_enabled?: boolean | null
          reminder_days?: number | null
          show_medications_in_dashboard?: boolean | null
          telegram_bot_enabled?: boolean | null
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_update_enabled?: boolean | null
          auto_delete_after_days?: number | null
          created_at?: string | null
          daily_notification_enabled?: boolean | null
          daily_notification_time?: string | null
          id?: string
          last_notification_check?: string | null
          launch_on_startup?: boolean | null
          medication_notifications_enabled?: boolean | null
          medication_reminder_minutes?: number | null
          medication_sound_enabled?: boolean | null
          notifications_enabled?: boolean | null
          reminder_days?: number | null
          show_medications_in_dashboard?: boolean | null
          telegram_bot_enabled?: boolean | null
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checks: {
        Row: {
          amount: number
          bill_type: string | null
          created_at: string | null
          created_by: string
          created_date: string
          custom_bill_type: string | null
          id: string
          is_paid: boolean | null
          is_recurring: boolean | null
          next_payment_date: string | null
          payment_date: string
          recurring_day: number | null
          recurring_type: string | null
          signed_to: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bill_type?: string | null
          created_at?: string | null
          created_by: string
          created_date: string
          custom_bill_type?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          next_payment_date?: string | null
          payment_date: string
          recurring_day?: number | null
          recurring_type?: string | null
          signed_to: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bill_type?: string | null
          created_at?: string | null
          created_by?: string
          created_date?: string
          custom_bill_type?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          next_payment_date?: string | null
          payment_date?: string
          recurring_day?: number | null
          recurring_type?: string | null
          signed_to?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          notes: string | null
          scheduled_time: string
          status: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_time: string
          status: string
          taken_at: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_time?: string
          status?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string | null
          created_by: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          month_day: number | null
          name: string
          notes: string | null
          start_date: string
          time: string
          updated_at: string | null
          user_id: string
          week_day: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          month_day?: number | null
          name: string
          notes?: string | null
          start_date: string
          time: string
          updated_at?: string | null
          user_id: string
          week_day?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          month_day?: number | null
          name?: string
          notes?: string | null
          start_date?: string
          time?: string
          updated_at?: string | null
          user_id?: string
          week_day?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const