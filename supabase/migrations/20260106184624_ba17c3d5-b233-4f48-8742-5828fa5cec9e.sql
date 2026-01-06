-- Add archived column to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN archived boolean DEFAULT false;