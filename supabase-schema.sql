-- Hatırlatıcınız Database Schema for Supabase
-- This file contains all the SQL commands to set up the database

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checks table
CREATE TABLE public.checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medications table
CREATE TABLE public.medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_logs table
CREATE TABLE public.medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT CHECK (status IN ('taken', 'missed', 'skipped')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reminder_days INTEGER DEFAULT 3,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_update_enabled BOOLEAN DEFAULT TRUE,
  daily_notification_enabled BOOLEAN DEFAULT TRUE,
  daily_notification_time TIME DEFAULT '09:00',
  last_notification_check TIMESTAMPTZ DEFAULT NOW(),
  telegram_bot_enabled BOOLEAN DEFAULT FALSE,
  telegram_bot_token TEXT DEFAULT '',
  telegram_chat_id TEXT DEFAULT '',
  theme TEXT DEFAULT 'light',
  medication_notifications_enabled BOOLEAN DEFAULT TRUE,
  medication_reminder_minutes INTEGER DEFAULT 15,
  show_medications_in_dashboard BOOLEAN DEFAULT TRUE,
  medication_sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Checks policies
CREATE POLICY "Users can view own checks" ON public.checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checks" ON public.checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checks" ON public.checks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checks" ON public.checks
  FOR DELETE USING (auth.uid() = user_id);

-- Medications policies
CREATE POLICY "Users can view own medications" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users can view own medication logs" ON public.medication_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication logs" ON public.medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication logs" ON public.medication_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication logs" ON public.medication_logs
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User')
  );
  
  -- Create default settings for new user
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_checks
  BEFORE UPDATE ON public.checks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_medications
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_checks_user_id ON public.checks(user_id);
CREATE INDEX idx_checks_payment_date ON public.checks(payment_date);
CREATE INDEX idx_checks_is_paid ON public.checks(is_paid);

CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_is_active ON public.medications(is_active);

CREATE INDEX idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX idx_medication_logs_taken_at ON public.medication_logs(taken_at);

CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);