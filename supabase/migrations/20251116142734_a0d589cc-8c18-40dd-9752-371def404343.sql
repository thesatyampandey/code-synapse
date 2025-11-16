-- Fix recursive RLS policies without duplicate constraints

-- 1) Replace recursive SELECT policy on room_members with function-based check
DROP POLICY IF EXISTS "Room members can view all members" ON public.room_members;
CREATE POLICY "Room members can view all members"
ON public.room_members
FOR SELECT
USING (public.is_room_member(auth.uid(), room_id));

-- 2) Profiles: avoid heavy self-joins and rely on is_room_member
DROP POLICY IF EXISTS "Users can view profiles of room members" ON public.profiles;
CREATE POLICY "Users can view profiles of room members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members rm
    WHERE rm.user_id = profiles.id
      AND public.is_room_member(auth.uid(), rm.room_id)
  )
);

-- 3) Add foreign key for messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Enable realtime with REPLICA IDENTITY (skip publication if already added)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.room_members REPLICA IDENTITY FULL;