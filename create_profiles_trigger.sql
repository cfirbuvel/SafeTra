-- 1. Create a profile row manually for info@presy.net and promote to Admin/Lawyer
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
    '145cfdc5-584e-4bf2-b8a8-de60f7454dad', 
    'General Admin', 
    'info@presy.net', 
    'admin'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    full_name = 'General Admin', 
    email = 'info@presy.net';

-- 2. Create a bulletproof trigger function to automatically create a profile for all new user sign-ups
-- We wrap the insert in an EXCEPTION block to ensure that even if profile creation fails, the auth signup does not crash.
-- We also omit the 'role' column so it defaults to 'user' automatically, avoiding enum type-resolution issues.
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
      new.email,
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback warning logging to prevent auth block
    RAISE WARNING 'Failed to create profile: %', SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
