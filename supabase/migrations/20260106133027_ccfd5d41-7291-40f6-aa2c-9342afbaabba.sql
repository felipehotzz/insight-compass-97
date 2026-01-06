-- Create customer_domains table to link email domains to customers
CREATE TABLE public.customer_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, domain)
);

-- Enable RLS
ALTER TABLE public.customer_domains ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_domains
CREATE POLICY "Authenticated users can view customer domains"
  ON public.customer_domains FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert customer domains"
  ON public.customer_domains FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update customer domains"
  ON public.customer_domains FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete customer domains"
  ON public.customer_domains FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  intercom_conversation_id TEXT UNIQUE NOT NULL,
  from_email TEXT,
  from_name TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'n2',
  assignee_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Authenticated users can view support tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete support tickets"
  ON public.support_tickets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  intercom_message_id TEXT UNIQUE,
  author_type TEXT NOT NULL,
  author_name TEXT,
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_messages
CREATE POLICY "Authenticated users can view support messages"
  ON public.support_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete support messages"
  ON public.support_messages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_customer_domains_updated_at
  BEFORE UPDATE ON public.customer_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster domain lookups
CREATE INDEX idx_customer_domains_domain ON public.customer_domains(domain);

-- Create index for faster ticket queries
CREATE INDEX idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at);