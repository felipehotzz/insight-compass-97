-- Create email_messages table for storing email threads
CREATE TABLE public.email_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  message_id TEXT,
  in_reply_to TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attachments JSONB DEFAULT '[]'
);

-- Create index for faster thread lookups
CREATE INDEX idx_email_messages_action_id ON public.email_messages(action_id);
CREATE INDEX idx_email_messages_message_id ON public.email_messages(message_id);
CREATE INDEX idx_email_messages_in_reply_to ON public.email_messages(in_reply_to);

-- Enable RLS
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view email messages" 
ON public.email_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert email messages" 
ON public.email_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update email messages" 
ON public.email_messages 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete email messages" 
ON public.email_messages 
FOR DELETE 
USING (true);