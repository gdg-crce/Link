-- ==============================================================================
-- GDG CRCE Branded Link Manager Schema Migration
-- Migration: 20260920000000_init_link_manager.sql
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create 'links' table
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

-- Case-insensitive unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_slug_lower ON public.links (LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_links_is_active ON public.links (is_active);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON public.links (created_at DESC);

-- 3. Create 'link_clicks' analytics table
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

-- 4. Automatically update 'updated_at' column on update
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

-- 5. Stored Procedure for atomic click increment and analytics logging
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

-- 6. Row Level Security (RLS)
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Public can read links for redirects
DROP POLICY IF EXISTS "Public can view active links" ON public.links;
CREATE POLICY "Public can view active links"
ON public.links
FOR SELECT
TO public
USING (true);

-- Authenticated admins have full CRUD on links
DROP POLICY IF EXISTS "Admins can manage all links" ON public.links;
CREATE POLICY "Admins can manage all links"
ON public.links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated admins can view clicks
DROP POLICY IF EXISTS "Admins can view link clicks" ON public.link_clicks;
CREATE POLICY "Admins can view link clicks"
ON public.link_clicks
FOR SELECT
TO authenticated
USING (true);

-- Public can insert clicks via the SECURITY DEFINER function or direct insert
DROP POLICY IF EXISTS "Service role and functions can insert clicks" ON public.link_clicks;
CREATE POLICY "Service role and functions can insert clicks"
ON public.link_clicks
FOR INSERT
TO public
WITH CHECK (true);
