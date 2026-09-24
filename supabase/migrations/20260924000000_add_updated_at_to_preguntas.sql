ALTER TABLE public.preguntas
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_preguntas_updated_at ON public.preguntas;
CREATE TRIGGER update_preguntas_updated_at
  BEFORE UPDATE ON public.preguntas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
