-- ==============================================================================
-- AURA (formerly RF Nexus) - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Engineered for vXr Holdings (Founders: Vishu Raj - CVO, Rishav Raj - CEO)
-- Exclusively for RAHUL FOUNDATION SOCIETY (5,000+ Members)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM SEQUENCES & ENUMS
CREATE SEQUENCE IF NOT EXISTS public.aura_username_seq START WITH 1 INCREMENT BY 1;

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM (
        'Student',
        'Teaching Staff',
        'Non-Teaching Staff',
        'Other Entity'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_type AS ENUM (
        'pending',
        'verified',
        'rejected',
        'offline_requested'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE,                      -- Auto-generated sequence upon approval: aura0001, aura0002, etc.
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    college_name TEXT NOT NULL DEFAULT 'Rahul Foundation Society',
    role user_role_type NOT NULL DEFAULT 'Student',
    society_id TEXT UNIQUE NOT NULL,           -- E.g. RFC-2025-XXXX / College ID
    id_card_url TEXT,                          -- Secure Cloudinary encrypted asset URL
    status verification_status_type NOT NULL DEFAULT 'pending',
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward-compatibility view for profiles
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- 4. FUNCTION & TRIGGER: AUTO-GENERATE `auraXXXX` USERNAME ON ADMIN APPROVAL
CREATE OR REPLACE FUNCTION public.assign_aura_username_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- When status flips to 'verified' and username is not yet assigned
    IF (NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified' OR NEW.username IS NULL OR NEW.username = '')) THEN
        NEW.username := 'aura' || LPAD(nextval('public.aura_username_seq')::TEXT, 4, '0');
        NEW.approved_at := NOW();
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_aura_username_approval ON public.users;
CREATE TRIGGER trg_assign_aura_username_approval
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_aura_username_on_approval();

-- Also trigger for direct verified inserts
CREATE OR REPLACE FUNCTION public.assign_aura_username_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'verified' AND (NEW.username IS NULL OR NEW.username = '')) THEN
        NEW.username := 'aura' || LPAD(nextval('public.aura_username_seq')::TEXT, 4, '0');
        NEW.approved_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_aura_username_insert ON public.users;
CREATE TRIGGER trg_assign_aura_username_insert
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_aura_username_on_insert();

-- 5. OFFLINE MANUAL VERIFICATION OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS public.offline_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'Student',
    department TEXT NOT NULL,
    hod_name TEXT NOT NULL,
    cabin_room TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 6. AUDIT LOGS & DISCIPLINARY INCIDENT REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.audit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_username TEXT NOT NULL,
    offender_username TEXT NOT NULL,
    offender_name TEXT NOT NULL,
    offender_society_id TEXT NOT NULL,
    incident_type TEXT NOT NULL,
    notes TEXT,
    room_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_society_id ON public.users(society_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status, is_banned);
CREATE INDEX IF NOT EXISTS idx_offline_status ON public.offline_verifications(status);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- Allow public signup (Insert)
CREATE POLICY "Allow public signup" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to read their own record by ID or JWT claim
CREATE POLICY "Users can read own profile" 
ON public.users 
FOR SELECT 
USING (
    auth.uid() = id 
    OR is_admin = true
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') = id::TEXT
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'username') = 'AURA-SYS-VISHU'
);

-- Allow users to update their own profile (e.g. mobile/password)
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (
    auth.uid() = id 
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
);

-- Admin Full Access Policy for Admins (AURA-SYS)
CREATE POLICY "Admins have full access to users"
ON public.users
FOR ALL
USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'username') = 'AURA-SYS-VISHU'
    OR is_admin = true
);

-- Offline verifications RLS
CREATE POLICY "Users can insert offline verifications"
ON public.offline_verifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own offline requests or admin"
ON public.offline_verifications
FOR SELECT
USING (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'username') = 'AURA-SYS-VISHU'
);

-- Incident Audit Reports RLS
CREATE POLICY "Anyone can report an incident"
ON public.audit_reports
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view incident reports"
ON public.audit_reports
FOR SELECT
USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'username') = 'AURA-SYS-VISHU'
);

-- 9. SEED ROOT SYSTEM ADMIN ACCOUNT (Password: vxr_aura_2025)
INSERT INTO public.users (
    username,
    full_name,
    mobile,
    college_name,
    role,
    society_id,
    status,
    password_hash,
    is_admin
) VALUES (
    'AURA-SYS-VISHU',
    'Vishu Raj (CVO)',
    '+91-9999999999',
    'Rahul Foundation Society Central Management',
    'Teaching Staff',
    'RFC-SYS-ADMIN-01',
    'verified',
    '$2b$12$K1...AdminHashPlaceholderOrDirectFastAPIBcrypt',
    TRUE
) ON CONFLICT (society_id) DO NOTHING;
