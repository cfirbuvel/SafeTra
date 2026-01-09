-- Migration: Add new vehicle and owner fields to deals table
-- Run this after the existing deals table has been created

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS owner_id_number TEXT,
ADD COLUMN IF NOT EXISTS engine_volume INTEGER,
ADD COLUMN IF NOT EXISTS license_expiry_date DATE,
ADD COLUMN IF NOT EXISTS previous_owners INTEGER,
ADD COLUMN IF NOT EXISTS chassis_number TEXT,
ADD COLUMN IF NOT EXISTS kilometers INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_reg_owner_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_reg_owner_id TEXT;

-- Add comments for clarity
COMMENT ON COLUMN deals.first_name IS 'First name from ID/License';
COMMENT ON COLUMN deals.last_name IS 'Last name from ID/License';
COMMENT ON COLUMN deals.owner_id_number IS 'ID number from ID/License';
COMMENT ON COLUMN deals.engine_volume IS 'Engine volume in CC from vehicle registration';
COMMENT ON COLUMN deals.license_expiry_date IS 'Vehicle license expiry date';
COMMENT ON COLUMN deals.previous_owners IS 'Number of previous owners';
COMMENT ON COLUMN deals.chassis_number IS 'Vehicle chassis/VIN number';
COMMENT ON COLUMN deals.kilometers IS 'Current vehicle kilometers (manual entry)';
COMMENT ON COLUMN deals.vehicle_reg_owner_name IS 'Owner name from vehicle registration (for comparison)';
COMMENT ON COLUMN deals.vehicle_reg_owner_id IS 'Owner ID from vehicle registration (for comparison)';
