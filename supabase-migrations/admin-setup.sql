-- Admin Dashboard Database Setup
-- Run this migration to add admin-specific features to your Supabase database

-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'citizen';
  END IF;
END $$;

-- Add admin-specific columns to reports table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='reports' AND column_name='status') THEN
    ALTER TABLE public.reports ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='reports' AND column_name='assigned_to') THEN
    ALTER TABLE public.reports ADD COLUMN assigned_to UUID REFERENCES public.profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='reports' AND column_name='admin_notes') THEN
    ALTER TABLE public.reports ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bounties table
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('wanted', 'missing_person', 'lost_pet')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT,
  reward NUMERIC DEFAULT 0,
  status TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  views INTEGER DEFAULT 0,
  crimes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ
);

-- Create lost_found_items table
CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  street_address TEXT,
  city TEXT DEFAULT 'Tuguegarao City',
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  reward NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved', 'archived')),
  case_id TEXT UNIQUE NOT NULL,
  case_officer TEXT,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Create community_resources table
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('hospital', 'therapist', 'legal_professional')),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Tuguegarao City',
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Create geofence_zones table
CREATE TABLE IF NOT EXISTS public.geofence_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('safety', 'danger', 'restricted')),
  coordinates JSONB NOT NULL,
  radius NUMERIC,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (admins only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for bounties
CREATE POLICY "Anyone can view approved bounties" ON public.bounties
  FOR SELECT
  TO authenticated
  USING (approved = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create bounties" ON public.bounties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update bounties" ON public.bounties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for lost_found_items
CREATE POLICY "Anyone can view lost/found items" ON public.lost_found_items
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can create lost/found reports" ON public.lost_found_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update lost/found items" ON public.lost_found_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    ) OR created_by = auth.uid()
  );

-- RLS Policies for community_resources
CREATE POLICY "Anyone can view community resources" ON public.community_resources
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage community resources" ON public.community_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- RLS Policies for system_config (admins only)
CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for geofence_zones
CREATE POLICY "Anyone can view active geofence zones" ON public.geofence_zones
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

CREATE POLICY "Admins can manage geofence zones" ON public.geofence_zones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bounties_type ON public.bounties(type);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON public.bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON public.bounties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_type ON public.lost_found_items(type);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_status ON public.lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_community_resources_type ON public.community_resources(type);
CREATE INDEX IF NOT EXISTS idx_geofence_zones_type ON public.geofence_zones(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_bounties_updated_at ON public.bounties;
CREATE TRIGGER update_bounties_updated_at
    BEFORE UPDATE ON public.bounties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_resources_updated_at ON public.community_resources;
CREATE TRIGGER update_community_resources_updated_at
    BEFORE UPDATE ON public.community_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON public.system_config;
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

