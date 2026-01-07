-- Add plano column to customers table
ALTER TABLE public.customers 
ADD COLUMN plano text DEFAULT NULL;

-- Add a comment to document the valid values
COMMENT ON COLUMN public.customers.plano IS 'Customer plan: Intelligence, Intelligence PRO, PRO, Enterprise';