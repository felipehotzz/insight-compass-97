-- Drop and recreate view with security_invoker = true (safe approach)
DROP VIEW IF EXISTS public.customer_metrics;

CREATE VIEW public.customer_metrics 
WITH (security_invoker = true)
AS
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