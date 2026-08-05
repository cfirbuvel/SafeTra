-- Migration: Add thumbnail_url and vehicle_images columns to public.deals table

ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_images TEXT[];

COMMENT ON COLUMN public.deals.thumbnail_url IS 'Selected primary vehicle image thumbnail URL';
COMMENT ON COLUMN public.deals.vehicle_images IS 'Array of uploaded vehicle photo URLs';
