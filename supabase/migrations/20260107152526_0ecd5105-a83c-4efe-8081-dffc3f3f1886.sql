-- Add phase tracking columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS fase text DEFAULT 'onboarding',
ADD COLUMN IF NOT EXISTS fase_changed_at timestamp with time zone DEFAULT now();

-- Add constraint for valid phases
ALTER TABLE public.customers
ADD CONSTRAINT customers_fase_check CHECK (fase IN ('onboarding', 'ongoing', 'renovacao', 'recuperacao', 'expansao'));