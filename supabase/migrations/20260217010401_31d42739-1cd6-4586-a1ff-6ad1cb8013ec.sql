
-- Table to map customers to Slack channels
CREATE TABLE public.customer_slack_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.customer_slack_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view slack channels" ON public.customer_slack_channels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can insert slack channels" ON public.customer_slack_channels FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update slack channels" ON public.customer_slack_channels FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete slack channels" ON public.customer_slack_channels FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_customer_slack_channels_updated_at
BEFORE UPDATE ON public.customer_slack_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
