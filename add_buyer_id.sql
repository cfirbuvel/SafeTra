-- 1. Add missing vehicle and OCR columns to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS id_doc_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_reg_doc_url TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS owner_id_number TEXT,
ADD COLUMN IF NOT EXISTS engine_volume INTEGER,
ADD COLUMN IF NOT EXISTS license_expiry_date TEXT,
ADD COLUMN IF NOT EXISTS previous_owners INTEGER,
ADD COLUMN IF NOT EXISTS chassis_number TEXT,
ADD COLUMN IF NOT EXISTS kilometers INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_reg_owner_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_reg_owner_id TEXT,
ADD COLUMN IF NOT EXISTS license_plate TEXT,
ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;

-- 2. Add invited_by column to profiles table referencing profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Create the deal_invitations table
CREATE TABLE IF NOT EXISTS public.deal_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on deal_invitations
ALTER TABLE public.deal_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS for the new column and check policies on deals
DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
CREATE POLICY "Users can view own deals" ON public.deals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
CREATE POLICY "Users can update own deals" ON public.deals
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- 6. Set up RLS policies for deal_invitations
DROP POLICY IF EXISTS "Users can view invitations for their deals" ON public.deal_invitations;
CREATE POLICY "Users can view invitations for their deals" ON public.deal_invitations
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (SELECT seller_id FROM public.deals WHERE id = deal_id)
    );

DROP POLICY IF EXISTS "Users can manage invitations for their deals" ON public.deal_invitations;
CREATE POLICY "Users can manage invitations for their deals" ON public.deal_invitations
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (SELECT seller_id FROM public.deals WHERE id = deal_id)
    );
