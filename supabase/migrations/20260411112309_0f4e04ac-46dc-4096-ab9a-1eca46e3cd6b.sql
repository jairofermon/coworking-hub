-- Add user_id to clientes to link client users
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
