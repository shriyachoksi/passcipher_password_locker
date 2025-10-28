-- Create passwords table for storing encrypted passwords
CREATE TABLE IF NOT EXISTS public.passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  website_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own passwords"
  ON public.passwords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passwords"
  ON public.passwords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passwords"
  ON public.passwords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passwords"
  ON public.passwords FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_passwords_user_id ON public.passwords(user_id);
