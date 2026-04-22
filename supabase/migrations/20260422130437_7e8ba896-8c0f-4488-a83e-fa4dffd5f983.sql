ALTER TABLE public.planos
ADD COLUMN IF NOT EXISTS valor_previsto numeric NOT NULL DEFAULT 0;