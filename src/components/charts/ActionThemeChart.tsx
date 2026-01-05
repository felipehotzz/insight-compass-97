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

interface ActionThemeData {
  period: string;
  renovacao: number;
  expansao: number;
  onboarding: number;
  contencao: number;
  suporte: number;
  tecnica: number;
  relacionamento: number;
  total: number;
}

interface ActionThemeChartProps {
  data: ActionThemeData[];
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

export function ActionThemeChart({ data, height = 280 }: ActionThemeChartProps) {
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
          dataKey="renovacao" 
          name="Renovação" 
          stackId="a" 
          fill="hsl(142 71% 45%)" 
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="expansao" 
          name="Expansão" 
          stackId="a" 
          fill="hsl(200 70% 50%)" 
        />
        <Bar 
          dataKey="onboarding" 
          name="Onboarding" 
          stackId="a" 
          fill="hsl(280 60% 55%)" 
        />
        <Bar 
          dataKey="contencao" 
          name="Contenção" 
          stackId="a" 
          fill="hsl(0 70% 55%)" 
        />
        <Bar 
          dataKey="suporte" 
          name="Suporte" 
          stackId="a" 
          fill="hsl(40 80% 50%)" 
        />
        <Bar 
          dataKey="tecnica" 
          name="Técnica" 
          stackId="a" 
          fill="hsl(0 0% 50%)" 
        />
        <Bar 
          dataKey="relacionamento" 
          name="Relacionamento" 
          stackId="a" 
          fill="hsl(320 60% 55%)" 
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function generateActionsThemeData(filter: string): ActionThemeData[] {
  const baseData: Record<string, ActionThemeData[]> = {
    day: [
      { period: "Seg", renovacao: 1, expansao: 1, onboarding: 2, contencao: 0, suporte: 2, tecnica: 1, relacionamento: 1, total: 8 },
      { period: "Ter", renovacao: 2, expansao: 0, onboarding: 1, contencao: 1, suporte: 1, tecnica: 2, relacionamento: 1, total: 8 },
      { period: "Qua", renovacao: 0, expansao: 2, onboarding: 2, contencao: 1, suporte: 2, tecnica: 1, relacionamento: 1, total: 9 },
      { period: "Qui", renovacao: 1, expansao: 1, onboarding: 1, contencao: 2, suporte: 2, tecnica: 1, relacionamento: 1, total: 9 },
      { period: "Sex", renovacao: 2, expansao: 1, onboarding: 1, contencao: 0, suporte: 1, tecnica: 1, relacionamento: 2, total: 8 },
    ],
    week: [
      { period: "Sem 1", renovacao: 5, expansao: 4, onboarding: 8, contencao: 3, suporte: 6, tecnica: 4, relacionamento: 2, total: 32 },
      { period: "Sem 2", renovacao: 6, expansao: 5, onboarding: 9, contencao: 4, suporte: 7, tecnica: 4, relacionamento: 3, total: 38 },
      { period: "Sem 3", renovacao: 4, expansao: 4, onboarding: 7, contencao: 3, suporte: 5, tecnica: 4, relacionamento: 3, total: 30 },
      { period: "Sem 4", renovacao: 7, expansao: 6, onboarding: 10, contencao: 4, suporte: 8, tecnica: 5, relacionamento: 3, total: 43 },
    ],
    month: [
      { period: "Jul", renovacao: 15, expansao: 12, onboarding: 28, contencao: 10, suporte: 22, tecnica: 15, relacionamento: 10, total: 112 },
      { period: "Ago", renovacao: 18, expansao: 14, onboarding: 32, contencao: 12, suporte: 25, tecnica: 17, relacionamento: 10, total: 128 },
      { period: "Set", renovacao: 16, expansao: 12, onboarding: 28, contencao: 11, suporte: 22, tecnica: 14, relacionamento: 10, total: 113 },
      { period: "Out", renovacao: 20, expansao: 15, onboarding: 35, contencao: 13, suporte: 28, tecnica: 18, relacionamento: 10, total: 139 },
      { period: "Nov", renovacao: 22, expansao: 16, onboarding: 38, contencao: 14, suporte: 30, tecnica: 19, relacionamento: 10, total: 149 },
      { period: "Dez", renovacao: 24, expansao: 17, onboarding: 40, contencao: 15, suporte: 32, tecnica: 20, relacionamento: 11, total: 159 },
    ],
    quarter: [
      { period: "Q1", renovacao: 48, expansao: 38, onboarding: 85, contencao: 32, suporte: 68, tecnica: 42, relacionamento: 24, total: 337 },
      { period: "Q2", renovacao: 55, expansao: 42, onboarding: 95, contencao: 36, suporte: 75, tecnica: 48, relacionamento: 25, total: 376 },
      { period: "Q3", renovacao: 60, expansao: 46, onboarding: 102, contencao: 38, suporte: 82, tecnica: 52, relacionamento: 27, total: 407 },
      { period: "Q4", renovacao: 68, expansao: 50, onboarding: 112, contencao: 42, suporte: 90, tecnica: 58, relacionamento: 28, total: 448 },
    ],
  };

  return baseData[filter] || baseData.month;
}
