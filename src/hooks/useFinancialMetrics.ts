import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialMetric {
  id: string;
  period_date: string;
  mrr: number | null;
  arr: number | null;
  gross_revenue: number | null;
  recurring_revenue: number | null;
  non_recurring_revenue: number | null;
  revenue_taxes: number | null;
  net_revenue: number | null;
  cost_of_services: number | null;
  gross_profit: number | null;
  gross_profit_margin: number | null;
  overhead_sga: number | null;
  sales_marketing_expenses: number | null;
  ga_expenses: number | null;
  ebitda: number | null;
  ebitda_margin: number | null;
  ebit: number | null;
  net_income: number | null;
  cash_flow_operations: number | null;
  free_cash_flow: number | null;
  cash_balance: number | null;
  customers_count: number | null;
  employees_count: number | null;
  created_at: string;
  updated_at: string;
}

export function useFinancialMetrics(limit?: number) {
  return useQuery({
    queryKey: ["financial-metrics", limit],
    queryFn: async () => {
      let query = supabase
        .from("financial_metrics")
        .select("*")
        .order("period_date", { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FinancialMetric[];
    },
  });
}

export function useLatestFinancialMetrics(months: number = 12) {
  return useQuery({
    queryKey: ["financial-metrics-latest", months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_metrics")
        .select("*")
        .order("period_date", { ascending: false })
        .limit(months);

      if (error) throw error;
      // Reverse to get chronological order
      return (data as FinancialMetric[]).reverse();
    },
  });
}

export function useFinancialMetricsByDateRange(
  startDate: Date | null,
  endDate: Date | null
) {
  return useQuery({
    queryKey: ["financial-metrics-range", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("financial_metrics")
        .select("*")
        .order("period_date", { ascending: true });

      if (startDate) {
        query = query.gte("period_date", startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        query = query.lte("period_date", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FinancialMetric[];
    },
  });
}

// Format month from date to display format (e.g., "2024-01-01" -> "Jan/24")
export function formatMonthLabel(dateStr: string): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const date = new Date(dateStr);
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
}