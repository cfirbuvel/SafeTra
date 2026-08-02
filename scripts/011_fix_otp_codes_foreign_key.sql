-- 1. Drop the existing foreign key constraint on otp_codes pointing to the legacy users table
ALTER TABLE IF EXISTS public.otp_codes 
DROP CONSTRAINT IF EXISTS otp_codes_user_id_fkey;

-- 2. Drop the sessions table since it is managed server-side and unused (or references legacy users)
DROP TABLE IF EXISTS public.sessions CASCADE;

-- 3. Drop the legacy unused users table
DROP TABLE IF EXISTS public.users CASCADE;

-- 4. Add the new foreign key constraint on otp_codes pointing to auth.users(id)
ALTER TABLE public.otp_codes
ADD CONSTRAINT otp_codes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
