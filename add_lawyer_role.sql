

g5566y5789looi0ilkl
-- 0. Cleanup unused tables
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Create User Role Enum (Idempotent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'lawyer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add role column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- 3. Update Deal Status Enum
-- Trying standard snake_case "deal_status" typically used in Postgres
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'payment_verification';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'ownership_transfer_pending';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'cancelled';

-- (Optional) If we wanted to rename 'FUNDS_RECIEVED' etc, we would handle that, 
-- but simpler to just add the new semantic ones and migrate data if needed.

-- 4. Create RLS Policies for Lawyer Access
-- Allow Lawyers to view ALL profiles
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
CREATE POLICY "Lawyers can view all deals"mkn./ knknknkjj knknknk
ON deals FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'lawyer'
  )
);

-- Allow Lawyers to update ALL deals
CREATE POLICY "Lawyers can update all deals"
ON deals FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'lawyer'
  )
);
