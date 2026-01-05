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
          wrapperStyle={{ paddingTop: 20, fontSize: 10 }}
          iconType="square"
          iconSize={8}
          formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))', marginRight: 16 }}>{value}</span>}
        />
        <Bar 
          dataKey="n1" 
          name="N1" 
          stackId="a" 
          fill="hsl(var(--color-support))" 
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="n2" 
          name="N2" 
          stackId="a" 
          fill="hsl(var(--color-growth-alt))" 
        />
        <Bar 
          dataKey="n3" 
          name="N3" 
          stackId="a" 
          fill="hsl(var(--color-danger))" 
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

// Aggregate data generators for all customers view (General)
export function generateGeneralOpenedTicketsData(filter: string): SupportData[] {
  const baseData: Record<string, SupportData[]> = {
    day: [
      { period: "Seg", n1: 360, n2: 150, n3: 60, total: 570 },
      { period: "Ter", n1: 450, n2: 180, n3: 90, total: 720 },
      { period: "Qua", n1: 300, n2: 120, n3: 30, total: 450 },
      { period: "Qui", n1: 540, n2: 210, n3: 60, total: 810 },
      { period: "Sex", n1: 240, n2: 90, n3: 30, total: 360 },
    ],
    week: [
      { period: "Sem 1", n1: 1350, n2: 540, n3: 240, total: 2130 },
      { period: "Sem 2", n1: 1560, n2: 660, n3: 300, total: 2520 },
      { period: "Sem 3", n1: 1140, n2: 450, n3: 180, total: 1770 },
      { period: "Sem 4", n1: 1440, n2: 600, n3: 270, total: 2310 },
    ],
    month: [
      { period: "Jul", n1: 4680, n2: 1950, n3: 840, total: 7470 },
      { period: "Ago", n1: 5340, n2: 2160, n3: 960, total: 8460 },
      { period: "Set", n1: 4350, n2: 1740, n3: 750, total: 6840 },
      { period: "Out", n1: 5040, n2: 2040, n3: 900, total: 7980 },
      { period: "Nov", n1: 5460, n2: 2250, n3: 1050, total: 8760 },
      { period: "Dez", n1: 5850, n2: 2400, n3: 1140, total: 9390 },
    ],
    quarter: [
      { period: "Q1", n1: 12600, n2: 5250, n3: 2340, total: 20190 },
      { period: "Q2", n1: 14550, n2: 5940, n3: 2640, total: 23130 },
      { period: "Q3", n1: 15300, n2: 6300, n3: 2850, total: 24450 },
      { period: "Q4", n1: 16350, n2: 6750, n3: 3060, total: 26160 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateGeneralClosedTicketsData(filter: string): SupportData[] {
  const baseData: Record<string, SupportData[]> = {
    day: [
      { period: "Seg", n1: 420, n2: 180, n3: 30, total: 630 },
      { period: "Ter", n1: 390, n2: 150, n3: 60, total: 600 },
      { period: "Qua", n1: 480, n2: 210, n3: 90, total: 780 },
      { period: "Qui", n1: 330, n2: 120, n3: 60, total: 510 },
      { period: "Sex", n1: 450, n2: 180, n3: 60, total: 690 },
    ],
    week: [
      { period: "Sem 1", n1: 1560, n2: 600, n3: 270, total: 2430 },
      { period: "Sem 2", n1: 1440, n2: 540, n3: 240, total: 2220 },
      { period: "Sem 3", n1: 1650, n2: 660, n3: 300, total: 2610 },
      { period: "Sem 4", n1: 1500, n2: 630, n3: 270, total: 2400 },
    ],
    month: [
      { period: "Jul", n1: 4950, n2: 2040, n3: 900, total: 7890 },
      { period: "Ago", n1: 5160, n2: 2100, n3: 960, total: 8220 },
      { period: "Set", n1: 4740, n2: 1920, n3: 840, total: 7500 },
      { period: "Out", n1: 5250, n2: 2160, n3: 990, total: 8400 },
      { period: "Nov", n1: 5640, n2: 2340, n3: 1080, total: 9060 },
      { period: "Dez", n1: 5760, n2: 2400, n3: 1140, total: 9300 },
    ],
    quarter: [
      { period: "Q1", n1: 13500, n2: 5550, n3: 2460, total: 21510 },
      { period: "Q2", n1: 14850, n2: 6060, n3: 2760, total: 23670 },
      { period: "Q3", n1: 15600, n2: 6450, n3: 2940, total: 24990 },
      { period: "Q4", n1: 16650, n2: 6900, n3: 3150, total: 26700 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateGeneralBacklogData(filter: string): SupportData[] {
  const baseData: Record<string, SupportData[]> = {
    day: [
      { period: "Seg", n1: 240, n2: 120, n3: 90, total: 450 },
      { period: "Ter", n1: 300, n2: 150, n3: 120, total: 570 },
      { period: "Qua", n1: 180, n2: 90, n3: 60, total: 330 },
      { period: "Qui", n1: 360, n2: 180, n3: 120, total: 660 },
      { period: "Sex", n1: 150, n2: 60, n3: 90, total: 300 },
    ],
    week: [
      { period: "Sem 1", n1: 750, n2: 360, n3: 300, total: 1410 },
      { period: "Sem 2", n1: 900, n2: 450, n3: 360, total: 1710 },
      { period: "Sem 3", n1: 540, n2: 270, n3: 210, total: 1020 },
      { period: "Sem 4", n1: 840, n2: 420, n3: 330, total: 1590 },
    ],
    month: [
      { period: "Jul", n1: 2550, n2: 1260, n3: 1050, total: 4860 },
      { period: "Ago", n1: 2850, n2: 1440, n3: 1200, total: 5490 },
      { period: "Set", n1: 2340, n2: 1140, n3: 960, total: 4440 },
      { period: "Out", n1: 2640, n2: 1320, n3: 1110, total: 5070 },
      { period: "Nov", n1: 2760, n2: 1380, n3: 1140, total: 5280 },
      { period: "Dez", n1: 2940, n2: 1500, n3: 1260, total: 5700 },
    ],
    quarter: [
      { period: "Q1", n1: 7350, n2: 3600, n3: 3000, total: 13950 },
      { period: "Q2", n1: 8400, n2: 4140, n3: 3450, total: 15990 },
      { period: "Q3", n1: 7950, n2: 3900, n3: 3240, total: 15090 },
      { period: "Q4", n1: 8850, n2: 4440, n3: 3750, total: 17040 },
    ],
  };

  return baseData[filter] || baseData.month;
}
