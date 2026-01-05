import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ActionData {
  period: string;
  reuniao: number;
  email: number;
  ligacao: number;
  whatsapp: number;
  total: number;
}

interface ActionBreakdownChartProps {
  data: ActionData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <p className="text-lg font-medium mb-2">Total: {total.toLocaleString("pt-BR")}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const percentage = ((entry.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{entry.value.toLocaleString("pt-BR")}</span>
                  <span className="text-muted-foreground">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function ActionBreakdownChart({ data, height = 280 }: ActionBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="period"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
        <Legend 
          wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
          iconType="square"
          iconSize={8}
          formatter={(value) => <span style={{ marginRight: 12 }}>{value}</span>}
        />
        <Bar 
          dataKey="reuniao" 
          name="Reunião" 
          stackId="a" 
          fill="hsl(0 0% 70%)" 
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="email" 
          name="E-mail" 
          stackId="a" 
          fill="hsl(0 0% 55%)" 
        />
        <Bar 
          dataKey="ligacao" 
          name="Ligação" 
          stackId="a" 
          fill="hsl(0 0% 45%)" 
        />
        <Bar 
          dataKey="whatsapp" 
          name="WhatsApp" 
          stackId="a" 
          fill="hsl(0 0% 35%)" 
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function generateActionsData(filter: string): ActionData[] {
  const baseData: Record<string, ActionData[]> = {
    day: [
      { period: "Seg", reuniao: 2, email: 3, ligacao: 1, whatsapp: 2, total: 8 },
      { period: "Ter", reuniao: 3, email: 2, ligacao: 2, whatsapp: 1, total: 8 },
      { period: "Qua", reuniao: 1, email: 4, ligacao: 1, whatsapp: 3, total: 9 },
      { period: "Qui", reuniao: 2, email: 3, ligacao: 2, whatsapp: 2, total: 9 },
      { period: "Sex", reuniao: 4, email: 2, ligacao: 1, whatsapp: 1, total: 8 },
    ],
    week: [
      { period: "Sem 1", reuniao: 8, email: 12, ligacao: 5, whatsapp: 7, total: 32 },
      { period: "Sem 2", reuniao: 10, email: 14, ligacao: 6, whatsapp: 8, total: 38 },
      { period: "Sem 3", reuniao: 9, email: 11, ligacao: 4, whatsapp: 6, total: 30 },
      { period: "Sem 4", reuniao: 12, email: 15, ligacao: 7, whatsapp: 9, total: 43 },
    ],
    month: [
      { period: "Jul", reuniao: 28, email: 42, ligacao: 18, whatsapp: 24, total: 112 },
      { period: "Ago", reuniao: 32, email: 48, ligacao: 20, whatsapp: 28, total: 128 },
      { period: "Set", reuniao: 30, email: 45, ligacao: 16, whatsapp: 22, total: 113 },
      { period: "Out", reuniao: 35, email: 52, ligacao: 22, whatsapp: 30, total: 139 },
      { period: "Nov", reuniao: 38, email: 55, ligacao: 24, whatsapp: 32, total: 149 },
      { period: "Dez", reuniao: 40, email: 58, ligacao: 26, whatsapp: 35, total: 159 },
    ],
    quarter: [
      { period: "Q1", reuniao: 85, email: 130, ligacao: 52, whatsapp: 70, total: 337 },
      { period: "Q2", reuniao: 95, email: 145, ligacao: 58, whatsapp: 78, total: 376 },
      { period: "Q3", reuniao: 105, email: 155, ligacao: 62, whatsapp: 85, total: 407 },
      { period: "Q4", reuniao: 115, email: 168, ligacao: 70, whatsapp: 95, total: 448 },
    ],
  };

  return baseData[filter] || baseData.month;
}
