-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_cohort DATE,
  cs_responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  id_financeiro TEXT UNIQUE,
  id_contrato TEXT,
  status_cliente TEXT,
  status_contrato TEXT,
  tipo_documento TEXT,
  data_movimento DATE,
  vigencia_inicial DATE,
  vigencia_final DATE,
  meses_vigencia INTEGER,
  mrr NUMERIC,
  mrr_atual BOOLEAN DEFAULT false,
  movimento_mrr NUMERIC,
  tipo_movimento TEXT,
  valor_contrato NUMERIC,
  tipo_renovacao TEXT,
  indice_renovacao TEXT,
  vendedor TEXT,
  valor_original_mrr NUMERIC,
  observacoes TEXT,
  condicao_pagamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update customers"
  ON public.customers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete customers"
  ON public.customers FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for contracts
CREATE POLICY "Authenticated users can view contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update contracts"
  ON public.contracts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete contracts"
  ON public.contracts FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for customer metrics
CREATE VIEW public.customer_metrics AS
SELECT 
  c.id,
  c.cnpj,
  c.razao_social,
  c.nome_fantasia,
  c.status,
  c.data_cohort,
  c.cs_responsavel,
  COALESCE(SUM(CASE WHEN co.mrr_atual = true THEN co.mrr ELSE 0 END), 0) as mrr_atual_total,
  COALESCE(SUM(co.mrr * COALESCE(co.meses_vigencia, 1)), 0) as ltv_total,
  COUNT(co.id) as total_contratos,
  COUNT(CASE WHEN co.status_contrato = 'vigente' THEN 1 END) as contratos_vigentes,
  CASE 
    WHEN c.data_cohort IS NOT NULL 
    THEN EXTRACT(MONTH FROM AGE(NOW(), c.data_cohort))::INTEGER
    ELSE 0
  END as meses_ativo
FROM public.customers c
LEFT JOIN public.contracts co ON co.customer_id = c.id
GROUP BY c.id, c.cnpj, c.razao_social, c.nome_fantasia, c.status, c.data_cohort, c.cs_responsavel;