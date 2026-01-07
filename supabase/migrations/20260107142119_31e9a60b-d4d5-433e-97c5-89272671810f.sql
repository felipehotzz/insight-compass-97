-- Create sync_history table to track sync operations
CREATE TABLE public.sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_processed INTEGER DEFAULT 0,
  total_synced INTEGER DEFAULT 0,
  total_linked INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view sync history" 
ON public.sync_history 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert sync history" 
ON public.sync_history 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update sync history" 
ON public.sync_history 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete sync history" 
ON public.sync_history 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));