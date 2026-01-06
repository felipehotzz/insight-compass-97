import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--color-customers))",
  "hsl(var(--color-growth))",
  "hsl(var(--color-overview))",
  "hsl(var(--color-growth-alt))",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PaymentData {
  name: string;
  value: number;
  percentage: number;
}

export const MrrByPaymentChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["mrr-by-payment-model"],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from("contracts")
        .select("condicao_pagamento, mrr")
        .ilike("status_contrato", "vigente");

      if (error) throw error;

      // Group by payment condition
      const grouped: Record<string, number> = {};
      (contracts || []).forEach((contract) => {
        const key = contract.condicao_pagamento || "Outros";
        grouped[key] = (grouped[key] || 0) + (contract.mrr || 0);
      });

      // Calculate total and format data
      const total = Object.values(grouped).reduce((sum, val) => sum + val, 0);
      
      const result: PaymentData[] = Object.entries(grouped)
        .map(([name, value]) => ({
          name: name === "-" ? "Outros" : name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      // Merge "Outros" categories if needed
      const othersIndex = result.findIndex((r) => r.name === "Outros");
      if (othersIndex > -1) {
        const others = result.splice(othersIndex, 1)[0];
        const existingOthers = result.find((r) => r.name === "Outros");
        if (existingOthers) {
          existingOthers.value += others.value;
          existingOthers.percentage += others.percentage;
        } else {
          result.push(others);
        }
      }

      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as PaymentData;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-foreground">{formatCurrency(item.value)}</p>
          <p className="text-muted-foreground text-sm">
            {item.percentage.toFixed(1)}% do MRR total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
