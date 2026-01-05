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

interface SupportData {
  period: string;
  n1: number;
  n2: number;
  n3: number;
  total: number;
}

interface SupportBreakdownChartProps {
  data: SupportData[];
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

export function SupportBreakdownChart({ data, height = 280 }: SupportBreakdownChartProps) {
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
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
        <Legend 
          wrapperStyle={{ paddingTop: 16 }}
          iconType="square"
          iconSize={10}
        />
        <Bar 
          dataKey="n1" 
          name="N1" 
          stackId="a" 
          fill="hsl(0 0% 70%)" 
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="n2" 
          name="N2" 
          stackId="a" 
          fill="hsl(0 0% 50%)" 
        />
        <Bar 
          dataKey="n3" 
          name="N3" 
          stackId="a" 
          fill="hsl(0 0% 35%)" 
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Mock data generators
export function generateOpenedTicketsData(filter: string): SupportData[] {
  const baseData: Record<string, SupportData[]> = {
    day: [
      { period: "Seg", n1: 12, n2: 5, n3: 2, total: 19 },
      { period: "Ter", n1: 15, n2: 6, n3: 3, total: 24 },
      { period: "Qua", n1: 10, n2: 4, n3: 1, total: 15 },
      { period: "Qui", n1: 18, n2: 7, n3: 2, total: 27 },
      { period: "Sex", n1: 8, n2: 3, n3: 1, total: 12 },
    ],
    week: [
      { period: "Sem 1", n1: 45, n2: 18, n3: 8, total: 71 },
      { period: "Sem 2", n1: 52, n2: 22, n3: 10, total: 84 },
      { period: "Sem 3", n1: 38, n2: 15, n3: 6, total: 59 },
      { period: "Sem 4", n1: 48, n2: 20, n3: 9, total: 77 },
    ],
    month: [
      { period: "Jul", n1: 156, n2: 65, n3: 28, total: 249 },
      { period: "Ago", n1: 178, n2: 72, n3: 32, total: 282 },
      { period: "Set", n1: 145, n2: 58, n3: 25, total: 228 },
      { period: "Out", n1: 168, n2: 68, n3: 30, total: 266 },
      { period: "Nov", n1: 182, n2: 75, n3: 35, total: 292 },
      { period: "Dez", n1: 195, n2: 80, n3: 38, total: 313 },
    ],
    quarter: [
      { period: "Q1", n1: 420, n2: 175, n3: 78, total: 673 },
      { period: "Q2", n1: 485, n2: 198, n3: 88, total: 771 },
      { period: "Q3", n1: 510, n2: 210, n3: 95, total: 815 },
      { period: "Q4", n1: 545, n2: 225, n3: 102, total: 872 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateClosedTicketsData(filter: string): SupportData[] {
  const baseData: Record<string, SupportData[]> = {
    day: [
      { period: "Seg", n1: 14, n2: 6, n3: 1, total: 21 },
      { period: "Ter", n1: 13, n2: 5, n3: 2, total: 20 },
      { period: "Qua", n1: 16, n2: 7, n3: 3, total: 26 },
      { period: "Qui", n1: 11, n2: 4, n3: 2, total: 17 },
      { period: "Sex", n1: 15, n2: 6, n3: 2, total: 23 },
    ],
    week: [
      { period: "Sem 1", n1: 52, n2: 20, n3: 9, total: 81 },
      { period: "Sem 2", n1: 48, n2: 18, n3: 8, total: 74 },
      { period: "Sem 3", n1: 55, n2: 22, n3: 10, total: 87 },
      { period: "Sem 4", n1: 50, n2: 21, n3: 9, total: 80 },
    ],
    month: [
      { period: "Jul", n1: 165, n2: 68, n3: 30, total: 263 },
      { period: "Ago", n1: 172, n2: 70, n3: 32, total: 274 },
      { period: "Set", n1: 158, n2: 64, n3: 28, total: 250 },
      { period: "Out", n1: 175, n2: 72, n3: 33, total: 280 },
      { period: "Nov", n1: 188, n2: 78, n3: 36, total: 302 },
      { period: "Dez", n1: 192, n2: 80, n3: 38, total: 310 },
    ],
    quarter: [
      { period: "Q1", n1: 450, n2: 185, n3: 82, total: 717 },
      { period: "Q2", n1: 495, n2: 202, n3: 92, total: 789 },
      { period: "Q3", n1: 520, n2: 215, n3: 98, total: 833 },
      { period: "Q4", n1: 555, n2: 230, n3: 105, total: 890 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateBacklogData(filter: string): SupportData[] {
  const baseData: Record<string, SupportData[]> = {
    day: [
      { period: "Seg", n1: 8, n2: 4, n3: 3, total: 15 },
      { period: "Ter", n1: 10, n2: 5, n3: 4, total: 19 },
      { period: "Qua", n1: 6, n2: 3, n3: 2, total: 11 },
      { period: "Qui", n1: 12, n2: 6, n3: 4, total: 22 },
      { period: "Sex", n1: 5, n2: 2, n3: 3, total: 10 },
    ],
    week: [
      { period: "Sem 1", n1: 25, n2: 12, n3: 10, total: 47 },
      { period: "Sem 2", n1: 30, n2: 15, n3: 12, total: 57 },
      { period: "Sem 3", n1: 18, n2: 9, n3: 7, total: 34 },
      { period: "Sem 4", n1: 28, n2: 14, n3: 11, total: 53 },
    ],
    month: [
      { period: "Jul", n1: 85, n2: 42, n3: 35, total: 162 },
      { period: "Ago", n1: 95, n2: 48, n3: 40, total: 183 },
      { period: "Set", n1: 78, n2: 38, n3: 32, total: 148 },
      { period: "Out", n1: 88, n2: 44, n3: 37, total: 169 },
      { period: "Nov", n1: 92, n2: 46, n3: 38, total: 176 },
      { period: "Dez", n1: 98, n2: 50, n3: 42, total: 190 },
    ],
    quarter: [
      { period: "Q1", n1: 245, n2: 120, n3: 100, total: 465 },
      { period: "Q2", n1: 280, n2: 138, n3: 115, total: 533 },
      { period: "Q3", n1: 265, n2: 130, n3: 108, total: 503 },
      { period: "Q4", n1: 295, n2: 148, n3: 125, total: 568 },
    ],
  };

  return baseData[filter] || baseData.month;
}
