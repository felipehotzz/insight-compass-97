-- Create financial_metrics table to store DRE data
CREATE TABLE public.financial_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_date DATE NOT NULL UNIQUE,
  mrr NUMERIC,
  arr NUMERIC,
  gross_revenue NUMERIC,
  recurring_revenue NUMERIC,
  non_recurring_revenue NUMERIC,
  revenue_taxes NUMERIC,
  net_revenue NUMERIC,
  cost_of_services NUMERIC,
  gross_profit NUMERIC,
  gross_profit_margin NUMERIC,
  overhead_sga NUMERIC,
  sales_marketing_expenses NUMERIC,
  ga_expenses NUMERIC,
  ebitda NUMERIC,
  ebitda_margin NUMERIC,
  ebit NUMERIC,
  net_income NUMERIC,
  cash_flow_operations NUMERIC,
  free_cash_flow NUMERIC,
  cash_balance NUMERIC,
  customers_count INTEGER,
  employees_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can view, only admins can modify
CREATE POLICY "Authenticated users can view financial metrics"
ON public.financial_metrics
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert financial metrics"
ON public.financial_metrics
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update financial metrics"
ON public.financial_metrics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete financial metrics"
ON public.financial_metrics
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_financial_metrics_updated_at
BEFORE UPDATE ON public.financial_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();