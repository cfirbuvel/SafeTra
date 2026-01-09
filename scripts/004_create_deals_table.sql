-- Rewriting SQL to fix syntax errors and ensure compatibility with Supabase
-- Drop existing type if it exists (safe approach)
DROP TYPE IF EXISTS deal_status CASCADE;

CREATE TYPE deal_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'READY_FOR_NEXT_STAGE', 'EXPIRED');

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price_ils NUMERIC NOT NULL CHECK (price_ils > 0),
  status deal_status DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can create deals" ON deals;
CREATE POLICY "Sellers can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can view their deals" ON deals;
CREATE POLICY "Sellers can view their deals"
  ON deals FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update their deals" ON deals;
CREATE POLICY "Sellers can update their deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

DROP TRIGGER IF EXISTS deals_update_timestamp ON deals;
DROP FUNCTION IF EXISTS update_deals_timestamp();

CREATE OR REPLACE FUNCTION update_deals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_update_timestamp
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION update_deals_timestamp();
