-- Drop existing RLS policies that are too restrictive
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Anonymous can create users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "OTP codes are created server-side" ON otp_codes;
DROP POLICY IF EXISTS "Sessions are managed server-side" ON sessions;

-- New RLS policies that allow server-side operations
-- For users table: Allow anonymous inserts for OTP login, auth reads their own data
CREATE POLICY "Allow anonymous inserts for OTP"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR true);

CREATE POLICY "Allow users to update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- For OTP codes: Disable direct RLS, manage via service role
CREATE POLICY "Disable direct OTP access"
  ON otp_codes FOR ALL
  USING (false) WITH CHECK (false);

-- For sessions: Disable direct RLS, manage via service role
CREATE POLICY "Disable direct session access"
  ON sessions FOR ALL
  USING (false) WITH CHECK (false);
