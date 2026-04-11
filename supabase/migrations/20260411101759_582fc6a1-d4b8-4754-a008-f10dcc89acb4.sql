
CREATE TABLE public.faturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  contrato_id UUID,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  forma_pagamento TEXT,
  observacao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage faturas"
ON public.faturas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_faturas_updated_at
BEFORE UPDATE ON public.faturas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
