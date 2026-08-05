-- Migration: Add birth_date, address, and city columns to public.profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN public.profiles.birth_date IS 'User date of birth extracted from ID/License';
COMMENT ON COLUMN public.profiles.address IS 'User address or city extracted from ID/License';
COMMENT ON COLUMN public.profiles.city IS 'User city extracted from ID/License';
