-- 1. Alter user_role enum to add 'admin' if not exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create or replace is_lawyer() helper function (only checks if explicitly lawyer)
CREATE OR REPLACE FUNCTION public.is_lawyer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'lawyer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create is_lawyer_or_admin() helper function
CREATE OR REPLACE FUNCTION public.is_lawyer_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('lawyer', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update RLS policies on profiles
DROP POLICY IF EXISTS "Lawyers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;

CREATE POLICY "Lawyers and admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING ( is_lawyer_or_admin() );

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING ( is_admin() );

-- 6. Update RLS policies on deals
DROP POLICY IF EXISTS "Lawyers can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Lawyers can update all deals" ON public.deals;
DROP POLICY IF EXISTS "Admins can do everything on deals" ON public.deals;

CREATE POLICY "Lawyers and admins can view all deals"
ON public.deals FOR SELECT
TO authenticated
USING ( is_lawyer_or_admin() );

CREATE POLICY "Lawyers and admins can update all deals"
ON public.deals FOR UPDATE
TO authenticated
USING ( is_lawyer_or_admin() )
WITH CHECK ( is_lawyer_or_admin() );

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_lawyer TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_lawyer_or_admin TO authenticated, service_role;
