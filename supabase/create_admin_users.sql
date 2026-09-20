-- ==============================================================================
-- Script: Create Confirmed Admin Users in Supabase
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/zeqkprhqldmawidubcxh/sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to safely insert or update user with password
DO $$
DECLARE
  rec RECORD;
  new_id UUID;
  users_to_create JSONB := '[
    {"email": "varadaj47@gmail.com", "password": "GdgAdmin#Varad2026!"},
    {"email": "gdgcrce@gmail.com", "password": "GdgCrce#Official2026!"},
    {"email": "abhishekjose780@gmail.com", "password": "GdgAdmin#Abhishek2026!"}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(users_to_create) AS x(email TEXT, password TEXT)
  LOOP
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = rec.email) THEN
      new_id := gen_random_uuid();

      -- Insert into auth.users
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_id,
        'authenticated',
        'authenticated',
        rec.email,
        crypt(rec.password, gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false,
        now(),
        now()
      );

      -- Insert identity record
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        new_id,
        new_id,
        format('{"sub":"%s","email":"%s"}', new_id::text, rec.email)::jsonb,
        'email',
        rec.email,
        now(),
        now(),
        now()
      );

      -- Ensure added to public.admin_users table
      INSERT INTO public.admin_users (email, role, notes)
      VALUES (rec.email, 'admin', 'Auto-created via setup script')
      ON CONFLICT (email) DO NOTHING;

      RAISE NOTICE 'Created admin user: %', rec.email;
    ELSE
      -- Update password if user exists
      UPDATE auth.users
      SET encrypted_password = crypt(rec.password, gen_salt('bf', 10)),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE email = rec.email;

      RAISE NOTICE 'Updated existing user password: %', rec.email;
    END IF;
  END LOOP;
END $$;
