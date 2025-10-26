-- Create files table for code editor persistence
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'typescript',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this collaborative editor)
CREATE POLICY "Files are viewable by everyone" 
ON public.files 
FOR SELECT 
USING (true);

CREATE POLICY "Files can be created by anyone" 
ON public.files 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Files can be updated by anyone" 
ON public.files 
FOR UPDATE 
USING (true);

CREATE POLICY "Files can be deleted by anyone" 
ON public.files 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster room queries
CREATE INDEX idx_files_room_id ON public.files(room_id);