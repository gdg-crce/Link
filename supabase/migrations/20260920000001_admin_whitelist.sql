-- ==============================================================================
-- GDG CRCE Link Manager - Admin Whitelist & Restrictive RLS Migration
-- Migration: 20260920000001_admin_whitelist.sql
-- ==============================================================================

-- 1. Create 'admin_users' whitelist table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower ON public.admin_users (LOWER(email));

-- 2. Helper function to check if an email is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF check_email IS NULL OR check_email = '' THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE LOWER(email) = LOWER(check_email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Update RLS policies to restrict admin access strictly to whitelisted emails
DROP POLICY IF EXISTS "Admins can manage all links" ON public.links;
CREATE POLICY "Admins can manage all links"
ON public.links
FOR ALL
TO authenticated
USING (public.is_admin((auth.jwt() ->> 'email')::text))
WITH CHECK (public.is_admin((auth.jwt() ->> 'email')::text));

DROP POLICY IF EXISTS "Admins can view link clicks" ON public.link_clicks;
CREATE POLICY "Admins can view link clicks"
ON public.link_clicks
FOR SELECT
TO authenticated
USING (public.is_admin((auth.jwt() ->> 'email')::text));

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_admin((auth.jwt() ->> 'email')::text));

DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;
CREATE POLICY "Admins can manage admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.is_admin((auth.jwt() ->> 'email')::text))
WITH CHECK (public.is_admin((auth.jwt() ->> 'email')::text));

-- 5. Insert initial authorized admin emails
INSERT INTO public.admin_users (email, role, notes)
VALUES
    ('varadaj47@gmail.com', 'admin', 'Lead Administrator'),
    ('gdgcrce@gmail.com', 'admin', 'GDG CRCE Chapter Admin')
ON CONFLICT (email) DO NOTHING;

