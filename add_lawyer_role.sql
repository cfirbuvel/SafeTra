-- 0. Cleanup unused tables
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Create User Role Enum (Idempotent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'lawyer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  id_number TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user'
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- 3. Update Deal Status Enum
-- Trying standard snake_case "deal_status" typically used in Postgres
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'payment_verification';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'ownership_transfer_pending';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 4. Create RLS Policies for Lawyer Access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lawyers can view all profiles" ON profiles;
CREATE POLICY "Lawyers can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() IN 
  (
    SELECT id FROM profiles WHERE role = 'lawyer'
  )
);

-- Allow Lawyers to view ALL deals
DROP POLICY IF EXISTS "Lawyers can view all deals" ON deals;
CREATE POLICY "Lawyers can view all deals"
ON deals FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'lawyer'
  )
);

-- Allow Lawyers to update ALL deals
DROP POLICY IF EXISTS "Lawyers can update all deals" ON deals;
CREATE POLICY "Lawyers can update all deals"
ON deals FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'lawyer'
  )
);
