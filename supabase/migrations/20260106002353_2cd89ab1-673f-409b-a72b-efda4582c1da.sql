-- Create storage bucket for imported files
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false);

-- RLS policies for imports bucket
CREATE POLICY "Authenticated users can upload imports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view imports"
ON storage.objects FOR SELECT
USING (bucket_id = 'imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete imports"
ON storage.objects FOR DELETE
USING (bucket_id = 'imports' AND has_role(auth.uid(), 'admin'));

-- Create import_history table to track imports
CREATE TABLE public.import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_type TEXT NOT NULL, -- 'customers_contracts', 'financial_data'
  file_name TEXT NOT NULL,
  file_path TEXT, -- path in storage bucket
  imported_by UUID REFERENCES auth.users(id),
  customers_created INTEGER DEFAULT 0,
  customers_updated INTEGER DEFAULT 0,
  contracts_created INTEGER DEFAULT 0,
  contracts_updated INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'failed', 'rolled_back'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view import history"
ON public.import_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert import history"
ON public.import_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete import history"
ON public.import_history FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update import history"
ON public.import_history FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add import_id to customers and contracts to track which import created them
ALTER TABLE public.customers ADD COLUMN import_id UUID REFERENCES public.import_history(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN import_id UUID REFERENCES public.import_history(id) ON DELETE SET NULL;