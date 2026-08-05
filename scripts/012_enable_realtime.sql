-- Enable Realtime publication & Replica Identity for tables
ALTER TABLE public.deals REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.deal_invitations REPLICA IDENTITY FULL;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_invitations;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN OTHERS THEN null;
END $$;
