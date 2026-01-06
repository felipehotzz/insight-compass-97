-- Add resend_email_id column to store Resend's email ID for attachment downloads
ALTER TABLE public.email_messages 
ADD COLUMN IF NOT EXISTS resend_email_id TEXT;