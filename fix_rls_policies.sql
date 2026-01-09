-- 1. Create a secure function to check role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_lawyer()
RETURNS boolean AS $$
BEGIN
  -- SECURITY DEFINER allows this to run with privileges of the creator (postgres/admin)
  -- bypassing RLS on the profiles table for this check.
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'lawyer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop potentially problematic/recusive policies
DROP POLICY IF EXISTS "Lawyers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Lawyers can view all deals" ON deals;
DROP POLICY IF EXISTS "Lawyers can update all deals" ON deals;

-- 3. Ensure basic "View Own Profile" policy exists (Critical for getCurrentUser)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- 4. Re-create Lawyer policies using the safe function
CREATE POLICY "Lawyers can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING ( is_lawyer() );

CREATE POLICY "Lawyers can view all deals"
ON deals FOR SELECT
TO authenticated
USING ( is_lawyer() );

CREATE POLICY "Lawyers can update all deals"
ON deals FOR UPDATE
TO authenticated
USING ( is_lawyer() );

-- 5. Grant execute permission just in case
GRANT EXECUTE ON FUNCTION public.is_lawyer TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lawyer TO service_role;
