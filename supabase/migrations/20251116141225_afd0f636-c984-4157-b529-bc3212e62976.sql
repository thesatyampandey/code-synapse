-- Allow users to view profiles of members in their rooms
CREATE POLICY "Users can view profiles of room members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members rm1
    INNER JOIN public.room_members rm2 ON rm1.room_id = rm2.room_id
    WHERE rm1.user_id = auth.uid()
      AND rm2.user_id = profiles.id
  )
);