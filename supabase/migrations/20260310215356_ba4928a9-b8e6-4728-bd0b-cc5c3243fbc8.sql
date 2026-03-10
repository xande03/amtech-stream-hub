
-- Table to store admin-configured Xtream Codes playlist credentials
CREATE TABLE public.admin_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  playlist_name TEXT NOT NULL DEFAULT 'Principal',
  access_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only allow read of non-sensitive fields via RPC (no direct select)
-- Admin will manage via edge function with secret admin key

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_admin_config_updated_at
  BEFORE UPDATE ON public.admin_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate access code (security definer so RLS is bypassed)
CREATE OR REPLACE FUNCTION public.validate_access_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_record RECORD;
BEGIN
  SELECT id, server_url, username, password, playlist_name
  INTO config_record
  FROM public.admin_config
  WHERE access_code = code AND is_active = true
  LIMIT 1;

  IF config_record IS NULL THEN
    RETURN json_build_object('valid', false);
  END IF;

  RETURN json_build_object(
    'valid', true,
    'config_id', config_record.id,
    'server_url', config_record.server_url,
    'username', config_record.username,
    'password', config_record.password,
    'playlist_name', config_record.playlist_name
  );
END;
$$;
