-- Create champions table for customer contacts
CREATE TABLE public.champions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.champions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view champions"
  ON public.champions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert champions"
  ON public.champions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update champions"
  ON public.champions
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete champions"
  ON public.champions
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_champions_updated_at
  BEFORE UPDATE ON public.champions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();