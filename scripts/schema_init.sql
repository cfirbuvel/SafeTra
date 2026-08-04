-- SafeTra Consolidated Master Database Schema Initialization Script
-- Run this script in the Supabase SQL Editor for new environments (Dev / Staging / Production)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'lawyer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'READY_FOR_NEXT_STAGE',
        'AWAITING_PAYMENT',
        'PAYMENT_VERIFICATION',
        'OWNERSHIP_TRANSFER_PENDING',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Public Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  id_number TEXT,
  teudat_zehut TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Lawyers can view all profiles" ON public.profiles;
CREATE POLICY "Lawyers can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'lawyer' OR role = 'admin')
  );

-- 3. Create Deals Table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price_ils NUMERIC NOT NULL CHECK (price_ils > 0),
  status deal_status DEFAULT 'DRAFT',
  license_plate TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  id_doc_url TEXT,
  vehicle_reg_doc_url TEXT,
  first_name TEXT,
  last_name TEXT,
  owner_id_number TEXT,
  engine_volume INTEGER,
  license_expiry_date TEXT,
  previous_owners INTEGER,
  chassis_number TEXT,
  kilometers INTEGER,
  vehicle_reg_owner_name TEXT,
  vehicle_reg_owner_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Deals Policies
DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
CREATE POLICY "Users can view own deals" ON public.deals
  FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can create deals" ON public.deals;
CREATE POLICY "Sellers can create deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
CREATE POLICY "Users can update own deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Lawyers can view all deals" ON public.deals;
CREATE POLICY "Lawyers can view all deals" ON public.deals
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'lawyer' OR role = 'admin'));

DROP POLICY IF EXISTS "Lawyers can update all deals" ON public.deals;
CREATE POLICY "Lawyers can update all deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'lawyer' OR role = 'admin'));

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'SYSTEM',
  title TEXT NOT NULL,
  content TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Create OTP Codes Table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "OTP codes service access" ON public.otp_codes;
CREATE POLICY "OTP codes service access" ON public.otp_codes
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Create Deal Invitations Table
CREATE TABLE IF NOT EXISTS public.deal_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.deal_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invitations for their deals" ON public.deal_invitations;
CREATE POLICY "Users can view invitations for their deals" ON public.deal_invitations
    FOR SELECT TO authenticated
    USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (SELECT seller_id FROM public.deals WHERE id = deal_id)
    );

DROP POLICY IF EXISTS "Users can manage invitations for their deals" ON public.deal_invitations;
CREATE POLICY "Users can manage invitations for their deals" ON public.deal_invitations
    FOR ALL TO authenticated
    USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (SELECT seller_id FROM public.deals WHERE id = deal_id)
    );

-- 7. New User Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
      new.email,
      COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
    )
    ON CONFLICT (id) DO UPDATE SET
      avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url, new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile: %', SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

