-- Fix Infinite Recursion in PostgreSQL RLS Policies for relation "profiles"
-- Issue: "SELECT id FROM profiles WHERE role = 'lawyer'" inside profiles RLS policy caused error 42P17.

-- 1. Create a SECURITY DEFINER helper function that checks lawyer status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_lawyer(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'lawyer'::user_role
  );
$$;

-- 2. Drop the recursive policy on profiles
DROP POLICY IF EXISTS "Lawyers can view all profiles" ON public.profiles;

-- 3. Re-create clean RLS policies for profiles without subquery recursion
DROP POLICY IF EXISTS "Public profiles are viewable by owner or lawyer" ON public.profiles;
CREATE POLICY "Public profiles are viewable by owner or lawyer"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.is_lawyer(auth.uid())
);

-- 4. Fix RLS policies on deals table to avoid recursion
DROP POLICY IF EXISTS "Lawyers can view all deals" ON public.deals;
CREATE POLICY "Lawyers can view all deals"
ON public.deals FOR SELECT
TO authenticated
USING (
  auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_lawyer(auth.uid())
);

DROP POLICY IF EXISTS "Lawyers can update all deals" ON public.deals;
CREATE POLICY "Lawyers can update all deals"
ON public.deals FOR UPDATE
TO authenticated
USING (
  auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_lawyer(auth.uid())
);
