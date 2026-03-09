-- Schema for Maatri Shield AI (Advanced Maternal Monitoring)

-- 1. Profiles Table (Extends Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('patient', 'doctor', 'guardian')),
  age INTEGER,
  mobile TEXT,
  emergency_contact TEXT,
  medicine_times TEXT,
  pregnancy_type TEXT,
  hospital_name TEXT,
  relationship TEXT,
  address TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add missing columns if they don't exist (run in Supabase SQL editor)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medicine_times TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship TEXT;

-- Migration: Update role check constraint to include 'guardian'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('patient', 'doctor', 'guardian'));

-- 2. Health Logs Table
CREATE TABLE IF NOT EXISTS public.health_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  systolic INTEGER,
  diastolic INTEGER,
  glucose_fasting INTEGER,
  glucose_pp INTEGER,
  heart_rate INTEGER,
  weight DECIMAL,
  o2_sat INTEGER,
  risk_level TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Connections Table
CREATE TABLE IF NOT EXISTS public.connections (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  text TEXT,
  type TEXT DEFAULT 'text',
  status TEXT DEFAULT 'sent',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Clinical Reports Table
CREATE TABLE IF NOT EXISTS public.clinical_reports (
  id BIGSERIAL PRIMARY KEY,
  patient_email TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI History Table
CREATE TABLE IF NOT EXISTS public.ai_history (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  history JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  doctor_email TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  appointment_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Rules

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all (for searching doctors), but only update their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Health Logs: Owner can read/write, and connected doctors-- Health Log policies
DROP POLICY IF EXISTS "Users can view their own health logs." ON public.health_logs;
DROP POLICY IF EXISTS "Doctors can view health logs of their connected patients." ON public.health_logs;
DROP POLICY IF EXISTS "Users can insert their own health logs." ON public.health_logs;

CREATE POLICY "Users can view their own health logs." ON public.health_logs
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Connected users can view health logs." ON public.health_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.connections
            WHERE (
              (to_email = auth.jwt() ->> 'email' AND from_email = public.health_logs.user_email)
              OR 
              (from_email = auth.jwt() ->> 'email' AND to_email = public.health_logs.user_email)
            )
            AND status = 'accepted'
        )
    );

CREATE POLICY "Users can insert their own health logs." ON public.health_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

-- Connections: Involved parties can see/manage
DROP POLICY IF EXISTS "Users can see their own connections." ON public.connections;
DROP POLICY IF EXISTS "Users can manage their own connections." ON public.connections;
CREATE POLICY "Users can see their own connections." ON public.connections FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR
  from_email = auth.jwt() ->> 'email' OR
  to_email = auth.jwt() ->> 'email'
);
CREATE POLICY "Users can manage their own connections." ON public.connections FOR ALL USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR
  from_email = auth.jwt() ->> 'email' OR
  to_email = auth.jwt() ->> 'email'
);

-- Messages: Involved parties can see/send
DROP POLICY IF EXISTS "Users can see their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can send messages." ON public.messages;
CREATE POLICY "Users can see their own messages." ON public.messages FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR
  from_email = auth.jwt() ->> 'email' OR
  to_email = auth.jwt() ->> 'email'
);
CREATE POLICY "Users can send messages." ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = from_user_id OR
  from_email = auth.jwt() ->> 'email'
);

-- Clinical Reports: Patient can read/write own, connected doctors can read/write
DROP POLICY IF EXISTS "Patients and connected doctors can see reports." ON public.clinical_reports;
DROP POLICY IF EXISTS "Doctors can insert reports for connected patients." ON public.clinical_reports;
DROP POLICY IF EXISTS "Users can see their own reports." ON public.clinical_reports;
DROP POLICY IF EXISTS "Authorized users can insert reports." ON public.clinical_reports;

CREATE POLICY "Connected users can see reports." ON public.clinical_reports FOR SELECT USING (
  patient_email = auth.jwt() ->> 'email' OR
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE (
        (to_email = auth.jwt() ->> 'email' AND from_email = public.clinical_reports.patient_email)
        OR 
        (from_email = auth.jwt() ->> 'email' AND to_email = public.clinical_reports.patient_email)
    )
    AND status = 'accepted'
  )
);

CREATE POLICY "Authorized users can insert reports." ON public.clinical_reports FOR INSERT WITH CHECK (
  patient_email = auth.jwt() ->> 'email' OR
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE (
        (to_email = auth.jwt() ->> 'email' AND from_email = public.clinical_reports.patient_email)
        OR 
        (from_email = auth.jwt() ->> 'email' AND to_email = public.clinical_reports.patient_email)
    )
    AND status = 'accepted'
  )
);

-- AI History: Only owner
DROP POLICY IF EXISTS "Users can see their own AI history." ON public.ai_history;
DROP POLICY IF EXISTS "Users can manage their own AI history." ON public.ai_history;
CREATE POLICY "Users can see their own AI history." ON public.ai_history FOR SELECT USING (
  user_email = auth.jwt() ->> 'email'
);
CREATE POLICY "Users can manage their own AI history." ON public.ai_history FOR ALL USING (
  user_email = auth.jwt() ->> 'email'
);

-- Appointments: Doctors and Patients involved can see/manage
DROP POLICY IF EXISTS "Involved parties can see appointments." ON public.appointments;
DROP POLICY IF EXISTS "Doctors can insert appointments." ON public.appointments;
DROP POLICY IF EXISTS "Involved parties can update appointments." ON public.appointments;

CREATE POLICY "Involved parties can see appointments." ON public.appointments FOR SELECT USING (
  doctor_email = auth.jwt() ->> 'email' OR
  patient_email = auth.jwt() ->> 'email'
);

CREATE POLICY "Doctors can insert appointments." ON public.appointments FOR INSERT WITH CHECK (
  doctor_email = auth.jwt() ->> 'email'
);

CREATE POLICY "Involved parties can update appointments." ON public.appointments FOR UPDATE USING (
  doctor_email = auth.jwt() ->> 'email' OR
  patient_email = auth.jwt() ->> 'email'
);
