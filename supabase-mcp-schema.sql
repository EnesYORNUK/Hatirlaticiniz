-- Supabase MCP Database Schema
-- This schema is optimized for MCP (Model Context Protocol) usage

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table with MCP-friendly structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checks table with enhanced MCP support
CREATE TABLE IF NOT EXISTS public.checks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_by TEXT NOT NULL,
  signed_to TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  type TEXT CHECK (type IN ('check', 'bill')) NOT NULL,
  bill_type TEXT CHECK (bill_type IN ('elektrik', 'su', 'dogalgaz', 'telefon', 'internet', 'diger')),
  custom_bill_type TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type TEXT CHECK (recurring_type IN ('monthly', 'weekly', 'yearly')),
  recurring_day INTEGER,
  next_payment_date DATE,
  notes TEXT,
  tags TEXT[], -- Array for MCP tagging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medications table with MCP optimization
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
  time TIME NOT NULL,
  week_day INTEGER CHECK (week_day BETWEEN 1 AND 7),
  month_day INTEGER CHECK (month_day BETWEEN 1 AND 31),
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  side_effects TEXT[],
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_logs table with enhanced tracking
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT CHECK (status IN ('taken', 'missed', 'skipped')) NOT NULL,
  notes TEXT,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_settings table with MCP-friendly JSON structure
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{
    "reminderDays": 3,
    "notificationsEnabled": true,
    "autoUpdateEnabled": true,
    "dailyNotificationEnabled": true,
    "dailyNotificationTime": "09:00",
    "lastNotificationCheck": "",
    "telegramBotEnabled": false,
    "telegramBotToken": "",
    "telegramChatId": "",
    "theme": "light",
    "medicationNotificationsEnabled": true,
    "medicationReminderMinutes": 15,
    "showMedicationsInDashboard": true,
    "medicationSoundEnabled": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MCP
-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Checks policies
DROP POLICY IF EXISTS "Users can manage own checks" ON public.checks;
CREATE POLICY "Users can manage own checks" ON public.checks
  FOR ALL USING (auth.uid() = user_id);

-- Medications policies
DROP POLICY IF EXISTS "Users can manage own medications" ON public.medications;
CREATE POLICY "Users can manage own medications" ON public.medications
  FOR ALL USING (auth.uid() = user_id);

-- Medication logs policies
DROP POLICY IF EXISTS "Users can manage own medication logs" ON public.medication_logs;
CREATE POLICY "Users can manage own medication logs" ON public.medication_logs
  FOR ALL USING (auth.uid() = user_id);

-- User settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Functions for MCP optimization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User')
  );
  
  -- Create default settings for new user with JSONB
  INSERT INTO public.user_settings (user_id, settings)
  VALUES (NEW.id, '{
    "reminderDays": 3,
    "notificationsEnabled": true,
    "autoUpdateEnabled": true,
    "dailyNotificationEnabled": true,
    "dailyNotificationTime": "09:00",
    "lastNotificationCheck": "",
    "telegramBotEnabled": false,
    "telegramBotToken": "",
    "telegramChatId": "",
    "theme": "light",
    "medicationNotificationsEnabled": true,
    "medicationReminderMinutes": 15,
    "showMedicationsInDashboard": true,
    "medicationSoundEnabled": true
  }'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_checks ON public.checks;
CREATE TRIGGER set_updated_at_checks
  BEFORE UPDATE ON public.checks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_medications ON public.medications;
CREATE TRIGGER set_updated_at_medications
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for MCP performance optimization
CREATE INDEX IF NOT EXISTS idx_checks_user_id ON public.checks(user_id);
CREATE INDEX IF NOT EXISTS idx_checks_payment_date ON public.checks(payment_date);
CREATE INDEX IF NOT EXISTS idx_checks_is_paid ON public.checks(is_paid);
CREATE INDEX IF NOT EXISTS idx_checks_type ON public.checks(type);
CREATE INDEX IF NOT EXISTS idx_checks_tags ON public.checks USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_is_active ON public.medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medications_frequency ON public.medications(frequency);

CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON public.medication_logs(taken_at);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_settings ON public.user_settings USING GIN(settings);

-- MCP-specific views for better data access
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  (
    SELECT COUNT(*) 
    FROM public.checks c 
    WHERE c.user_id = p.id AND c.is_paid = false
  ) as pending_checks,
  (
    SELECT COUNT(*) 
    FROM public.medications m 
    WHERE m.user_id = p.id AND m.is_active = true
  ) as active_medications,
  us.settings
FROM public.profiles p
LEFT JOIN public.user_settings us ON us.user_id = p.id;

-- Grant permissions for MCP
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.checks TO authenticated;
GRANT ALL ON public.medications TO authenticated;
GRANT ALL ON public.medication_logs TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;
GRANT SELECT ON public.user_dashboard TO authenticated;