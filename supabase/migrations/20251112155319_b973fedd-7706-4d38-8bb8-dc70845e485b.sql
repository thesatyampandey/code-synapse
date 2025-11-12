-- Create role enum
CREATE TYPE public.room_role AS ENUM ('owner', 'editor', 'viewer');

-- Add role column to room_members (default to viewer)
ALTER TABLE public.room_members 
ADD COLUMN role public.room_role NOT NULL DEFAULT 'viewer';

-- Update existing room members: first member of each room becomes owner
WITH first_members AS (
  SELECT DISTINCT ON (room_id) room_id, user_id
  FROM public.room_members
  ORDER BY room_id, joined_at ASC
)
UPDATE public.room_members
SET role = 'owner'
FROM first_members
WHERE room_members.room_id = first_members.room_id
  AND room_members.user_id = first_members.user_id;

-- Create security definer function to check room role
CREATE OR REPLACE FUNCTION public.get_user_room_role(_user_id uuid, _room_id text)
RETURNS public.room_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.room_members
  WHERE user_id = _user_id
    AND room_id = _room_id
  LIMIT 1;
$$;

-- Create security definer function to check if user has minimum role
CREATE OR REPLACE FUNCTION public.has_room_permission(_user_id uuid, _room_id text, _min_role public.room_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.room_role;
  role_hierarchy int;
  min_role_hierarchy int;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public.room_members
  WHERE user_id = _user_id AND room_id = _room_id;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Define role hierarchy (higher number = more permissions)
  role_hierarchy := CASE user_role
    WHEN 'owner' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
  END;
  
  min_role_hierarchy := CASE _min_role
    WHEN 'owner' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
  END;
  
  RETURN role_hierarchy >= min_role_hierarchy;
END;
$$;

-- Update files RLS policies to enforce role-based permissions
DROP POLICY IF EXISTS "Room members can view files" ON public.files;
DROP POLICY IF EXISTS "Room members can create files" ON public.files;
DROP POLICY IF EXISTS "Room members can update files" ON public.files;
DROP POLICY IF EXISTS "Room members can delete files" ON public.files;

-- Viewers, editors, and owners can view files
CREATE POLICY "Room members can view files"
ON public.files
FOR SELECT
USING (has_room_permission(auth.uid(), room_id, 'viewer'));

-- Only editors and owners can create files
CREATE POLICY "Editors can create files"
ON public.files
FOR INSERT
WITH CHECK (has_room_permission(auth.uid(), room_id, 'editor'));

-- Only editors and owners can update files
CREATE POLICY "Editors can update files"
ON public.files
FOR UPDATE
USING (has_room_permission(auth.uid(), room_id, 'editor'));

-- Only owners can delete files
CREATE POLICY "Owners can delete files"
ON public.files
FOR DELETE
USING (has_room_permission(auth.uid(), room_id, 'owner'));

-- Update messages RLS policies to enforce role-based permissions
DROP POLICY IF EXISTS "Room members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Room members can create messages" ON public.messages;

-- Viewers, editors, and owners can view messages
CREATE POLICY "Room members can view messages"
ON public.messages
FOR SELECT
USING (has_room_permission(auth.uid(), room_id, 'viewer'));

-- Only editors and owners can send messages
CREATE POLICY "Editors can create messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND has_room_permission(auth.uid(), room_id, 'editor')
);

-- Update room_members RLS policies
DROP POLICY IF EXISTS "Users can view their own room memberships" ON public.room_members;

-- All room members can view all members in their rooms
CREATE POLICY "Room members can view all members"
ON public.room_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_members rm
    WHERE rm.room_id = room_members.room_id
      AND rm.user_id = auth.uid()
  )
);

-- Only owners can update member roles
CREATE POLICY "Owners can update member roles"
ON public.room_members
FOR UPDATE
USING (has_room_permission(auth.uid(), room_id, 'owner'));

-- Owners can remove members (except themselves)
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;

CREATE POLICY "Users can leave rooms"
ON public.room_members
FOR DELETE
USING (
  auth.uid() = user_id 
  OR has_room_permission(auth.uid(), room_id, 'owner')
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_room_members_room_user ON public.room_members(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_role ON public.room_members(role);