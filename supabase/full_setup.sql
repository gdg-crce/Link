-- ==============================================================================
-- GDG CRCE Branded Link Manager - Complete Schema & Security Setup
-- Project Ref: zeqkprhqldmawidubcxh
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create 'admin_users' whitelist table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- Index for fast case-insensitive email lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower ON public.admin_users (LOWER(email));

-- 3. Helper function to check if an email is an authorized admin
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

-- 4. Create 'links' table
CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    click_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NULL
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_slug_lower ON public.links (LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_links_is_active ON public.links (is_active);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON public.links (created_at DESC);

-- 5. Create 'link_clicks' analytics table
CREATE TABLE IF NOT EXISTS public.link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_agent TEXT,
    referer TEXT,
    ip_hash TEXT,
    country TEXT,
    device_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id_clicked ON public.link_clicks (link_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON public.link_clicks (clicked_at DESC);

-- 6. Trigger to automatically update 'updated_at' column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_links_updated_at ON public.links;
CREATE TRIGGER trigger_links_updated_at
BEFORE UPDATE ON public.links
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 7. Stored Procedure for atomic click increment and analytics logging
CREATE OR REPLACE FUNCTION public.record_link_click(
    target_link_id UUID,
    p_user_agent TEXT DEFAULT NULL,
    p_referer TEXT DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Atomically increment click count
    UPDATE public.links
    SET click_count = click_count + 1
    WHERE id = target_link_id;

    -- Record click details
    INSERT INTO public.link_clicks (
        link_id,
        clicked_at,
        user_agent,
        referer,
        ip_hash,
        country,
        device_type
    ) VALUES (
        target_link_id,
        now(),
        p_user_agent,
        p_referer,
        p_ip_hash,
        p_country,
        p_device_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- 8.1 admin_users RLS
-- Only admins can view or manage admin_users
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

-- 8.2 links RLS
-- Public can read all active links for redirects
DROP POLICY IF EXISTS "Public can view active links" ON public.links;
CREATE POLICY "Public can view active links"
ON public.links
FOR SELECT
TO public
USING (true);

-- Only whitelisted admins have full CRUD on links
DROP POLICY IF EXISTS "Admins can manage all links" ON public.links;
CREATE POLICY "Admins can manage all links"
ON public.links
FOR ALL
TO authenticated
USING (public.is_admin((auth.jwt() ->> 'email')::text))
WITH CHECK (public.is_admin((auth.jwt() ->> 'email')::text));

-- 8.3 link_clicks RLS
-- Only whitelisted admins can view link clicks
DROP POLICY IF EXISTS "Admins can view link clicks" ON public.link_clicks;
CREATE POLICY "Admins can view link clicks"
ON public.link_clicks
FOR SELECT
TO authenticated
USING (public.is_admin((auth.jwt() ->> 'email')::text));

-- Public / Service role can insert clicks
DROP POLICY IF EXISTS "Service role and functions can insert clicks" ON public.link_clicks;
CREATE POLICY "Service role and functions can insert clicks"
ON public.link_clicks
FOR INSERT
TO public
WITH CHECK (true);

-- 9. Initial Seed Data
-- Add default seed links
INSERT INTO public.links (slug, destination_url, title, description, is_active, click_count)
VALUES
    ('submission', 'https://example.com/gdg-crce-submission-form-demo', 'BitNBuild Project Submission (Demo)', 'Annual hackathon project submissions.', true, 142),
    ('register', 'https://example.com/gdg-crce-event-registration-demo', 'Upcoming Workshop Registration (Demo)', 'Workshop event RSVP.', true, 89),
    ('discord', 'https://example.com/gdg-crce-discord-invite-demo', 'GDG CRCE Discord Server (Demo)', 'Official student developer Discord.', true, 310),
    ('instagram', 'https://example.com/gdg-crce-instagram-demo', 'GDG CRCE Instagram (Demo)', 'Instagram community handle.', true, 205),
    ('website', 'https://example.com/gdg-crce-official-demo', 'GDG CRCE Chapter Website (Demo)', 'Chapter official website.', true, 521),
    ('bitnbuild', 'https://example.com/gdg-crce-bitnbuild-demo', 'BitNBuild Hackathon Portal (Demo)', 'National hackathon landing page.', true, 890)
ON CONFLICT (LOWER(slug)) DO NOTHING;

-- Initial authorized administrators
INSERT INTO public.admin_users (email, role, notes)
VALUES
    ('varadaj47@gmail.com', 'admin', 'Lead Administrator'),
    ('gdgcrce@gmail.com', 'admin', 'GDG CRCE Chapter Admin')
ON CONFLICT (email) DO NOTHING;

