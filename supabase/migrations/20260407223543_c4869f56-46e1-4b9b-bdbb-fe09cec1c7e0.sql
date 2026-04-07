
-- Add sequential code column to contratos
CREATE SEQUENCE IF NOT EXISTS contratos_codigo_seq START 1;

ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS codigo text NOT NULL DEFAULT '';

-- Function to auto-generate contract code on insert
CREATE OR REPLACE FUNCTION public.generate_contrato_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'CT-' || LPAD(nextval('contratos_codigo_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contratos_codigo
BEFORE INSERT ON public.contratos
FOR EACH ROW
EXECUTE FUNCTION public.generate_contrato_codigo();

-- Backfill existing contracts that have no code
UPDATE public.contratos
SET codigo = 'CT-' || LPAD(nextval('contratos_codigo_seq')::text, 4, '0')
WHERE codigo IS NULL OR codigo = '';
