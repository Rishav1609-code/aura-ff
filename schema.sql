-- ==============================================================================
-- AURA: SUPABASE (POSTGRESQL) PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Developed for vXr Holdings (Founders: Vishu Raj - CVO, Rishav Raj - CEO)
-- Exclusively for RAHUL FOUNDATION SOCIETY (5000+ Members)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
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

-- 3. PROFILES TABLE (Strict Identity Verification with Auto-Generated auraXXXX Usernames)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,            -- Auto-generated sequential ID: aura0001, aura0002, etc.
    full_name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'Student',
    society_id TEXT UNIQUE NOT NULL, -- E.g. RFC-2025-XXXX
    email TEXT UNIQUE,
    id_card_url TEXT,               -- Secure Cloudinary encrypted asset URL
    verification_status verification_status_type NOT NULL DEFAULT 'pending',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sequence for 4-digit sequential AURA usernames (e.g., aura0001, aura0002, aura0010, aura0500)
CREATE SEQUENCE IF NOT EXISTS public.aura_username_seq START WITH 1 INCREMENT BY 1;

-- Trigger Function: Auto-generates 'aura' || 4-digit zero-padded sequence
CREATE OR REPLACE FUNCTION public.generate_aura_username()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.username IS NULL OR NEW.username = '' THEN
        NEW.username := 'aura' || LPAD(nextval('public.aura_username_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Automatically sets unique auraXXXX on row insertion
DROP TRIGGER IF EXISTS trg_assign_aura_username ON public.profiles;
CREATE TRIGGER trg_assign_aura_username
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_aura_username();

-- Index for instant lookup during login & matchmaking
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_society_id ON public.profiles(society_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON public.profiles(verification_status, is_banned);

-- 4. OFFLINE VERIFICATION REQUESTS (For members without physical ID cards)
CREATE TABLE IF NOT EXISTS public.offline_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role_type NOT NULL,
    department TEXT NOT NULL,
    hod_name TEXT NOT NULL,
    cabin_room TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 5. ZERO-TOLERANCE CHAT REPORTS TABLE (Permanent Incident Auditing)
CREATE TABLE IF NOT EXISTS public.chat_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id TEXT,
    reason TEXT NOT NULL,
    evidence_data TEXT,
    action_taken TEXT DEFAULT 'under_investigation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AUDIT LOGS (Security Log Stream)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    actor_id UUID,
    target_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - ZERO-TRUST POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES RLS POLICIES
-- ------------------------------------------------------------------------------

-- Policy 1: Members can view verified profile details of any active society member
-- (Needed for displaying the sticker profile badge on connection)
DROP POLICY IF EXISTS "Public verified profile readout" ON public.profiles;
CREATE POLICY "Public verified profile readout"
ON public.profiles
FOR SELECT
USING (
    verification_status = 'verified' AND is_banned = FALSE
);

-- Policy 2: Authenticated users can read their own complete profile at any time
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = user_id
);

-- Policy 3: Users can insert their initial profile upon registration
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- Policy 4: Users can update their own non-security profile fields
-- Users CANNOT unban themselves or self-verify
DROP POLICY IF EXISTS "Users can update own details" ON public.profiles;
CREATE POLICY "Users can update own details"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id 
    AND verification_status = (SELECT verification_status FROM public.profiles WHERE user_id = auth.uid())
    AND is_banned = (SELECT is_banned FROM public.profiles WHERE user_id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- OFFLINE VERIFICATIONS RLS POLICIES
-- ------------------------------------------------------------------------------

-- Members can submit offline verification request for themselves
DROP POLICY IF EXISTS "Users submit own offline verification" ON public.offline_verifications;
CREATE POLICY "Users submit own offline verification"
ON public.offline_verifications
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- Members can check the status of their own request
DROP POLICY IF EXISTS "Users view own offline verification" ON public.offline_verifications;
CREATE POLICY "Users view own offline verification"
ON public.offline_verifications
FOR SELECT
USING (
    auth.uid() = user_id
);

-- ------------------------------------------------------------------------------
-- CHAT REPORTS RLS POLICIES
-- ------------------------------------------------------------------------------

-- Any authenticated member can report a violation
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.chat_reports;
CREATE POLICY "Authenticated users can submit reports"
ON public.chat_reports
FOR INSERT
WITH CHECK (
    auth.uid() = reporter_id
);

-- Reports can ONLY be viewed by Service Role or Admin
DROP POLICY IF EXISTS "Admin only read reports" ON public.chat_reports;
CREATE POLICY "Admin only read reports"
ON public.chat_reports
FOR SELECT
USING (
    auth.jwt() ->> 'role' = 'service_role'
);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.profiles;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ==============================================================================
-- INITIAL SEED: FOUNDERS & SYSTEM ADMINISTRATORS
-- ==============================================================================
-- Vishu Raj (CVO) & Rishav Raj (CEO) - vXr Holdings
INSERT INTO public.profiles (
    id, user_id, full_name, role, society_id, email, verification_status, is_banned
) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Vishu Raj', 'Other Entity', 'VXR-CVO-01', 'vishu.raj@vxrholdings.com', 'verified', FALSE),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Rishav Raj', 'Other Entity', 'VXR-CEO-02', 'rishav.raj@vxrholdings.com', 'verified', FALSE)
ON CONFLICT (society_id) DO NOTHING;
