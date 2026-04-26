CREATE TABLE public.plano_salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.planos(id) ON DELETE CASCADE,
  sala_id uuid NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plano_id, sala_id)
);

ALTER TABLE public.plano_salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to plano_salas"
ON public.plano_salas
FOR ALL
USING (true)
WITH CHECK (true);

-- Vincula planos existentes a todas as salas existentes para manter compatibilidade
INSERT INTO public.plano_salas (plano_id, sala_id)
SELECT p.id, s.id FROM public.planos p CROSS JOIN public.salas s
ON CONFLICT DO NOTHING;