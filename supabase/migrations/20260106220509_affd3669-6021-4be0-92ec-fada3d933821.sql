-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view attachments
CREATE POLICY "Anyone can view email attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-attachments');

-- Allow service role to insert attachments (edge functions)
CREATE POLICY "Service role can upload email attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-attachments');

-- Add column to track if attachments have been downloaded
ALTER TABLE public.email_messages 
ADD COLUMN IF NOT EXISTS attachments_downloaded boolean DEFAULT false;