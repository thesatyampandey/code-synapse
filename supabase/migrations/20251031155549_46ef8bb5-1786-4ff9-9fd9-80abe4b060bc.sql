-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by the owner
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create room_members table to track room access
CREATE TABLE public.room_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Room members can view their own memberships
CREATE POLICY "Users can view their own room memberships"
ON public.room_members
FOR SELECT
USING (auth.uid() = user_id);

-- Users can join rooms (create membership)
CREATE POLICY "Users can join rooms"
ON public.room_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms (delete membership)
CREATE POLICY "Users can leave rooms"
ON public.room_members
FOR DELETE
USING (auth.uid() = user_id);

-- Create security definer function to check room membership
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Drop existing permissive policies on files table
DROP POLICY IF EXISTS "Files are viewable by everyone" ON public.files;
DROP POLICY IF EXISTS "Files can be created by anyone" ON public.files;
DROP POLICY IF EXISTS "Files can be updated by anyone" ON public.files;
DROP POLICY IF EXISTS "Files can be deleted by anyone" ON public.files;

-- Create secure RLS policies for files table based on room membership
CREATE POLICY "Room members can view files"
ON public.files
FOR SELECT
USING (public.is_room_member(auth.uid(), room_id));

CREATE POLICY "Room members can create files"
ON public.files
FOR INSERT
WITH CHECK (public.is_room_member(auth.uid(), room_id));

CREATE POLICY "Room members can update files"
ON public.files
FOR UPDATE
USING (public.is_room_member(auth.uid(), room_id));

CREATE POLICY "Room members can delete files"
ON public.files
FOR DELETE
USING (public.is_room_member(auth.uid(), room_id));

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();