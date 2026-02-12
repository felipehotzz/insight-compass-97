
-- Table for real-time dispatch monitoring
CREATE TABLE public.dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicado TEXT NOT NULL,
  cliente TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processando',
  error_details TEXT,
  external_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dispatches"
ON public.dispatches FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert dispatches"
ON public.dispatches FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update dispatches"
ON public.dispatches FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatches;

-- Add tempo_real to app_page enum
ALTER TYPE public.app_page ADD VALUE IF NOT EXISTS 'tempo_real';
