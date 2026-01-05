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

interface ChannelData {
  period: string;
  email: number;
  teams: number;
  whatsapp: number;
  total: number;
}

interface ChannelBreakdownChartProps {
  data: ChannelData[];
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

export function ChannelBreakdownChart({ data, height = 280 }: ChannelBreakdownChartProps) {
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
          dataKey="email" 
          name="E-mail" 
          stackId="a" 
          fill="hsl(0 0% 70%)" 
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="teams" 
          name="Teams" 
          stackId="a" 
          fill="hsl(0 0% 50%)" 
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

// Mock data generator
export function generateChannelData(filter: string): ChannelData[] {
  const baseData: Record<string, ChannelData[]> = {
    day: [
      { period: "Seg", email: 180, teams: 120, whatsapp: 60, total: 360 },
      { period: "Ter", email: 195, teams: 135, whatsapp: 70, total: 400 },
      { period: "Qua", email: 210, teams: 150, whatsapp: 65, total: 425 },
      { period: "Qui", email: 175, teams: 125, whatsapp: 55, total: 355 },
      { period: "Sex", email: 160, teams: 110, whatsapp: 50, total: 320 },
    ],
    week: [
      { period: "Sem 1", email: 450, teams: 315, whatsapp: 180, total: 945 },
      { period: "Sem 2", email: 520, teams: 350, whatsapp: 195, total: 1065 },
      { period: "Sem 3", email: 480, teams: 340, whatsapp: 185, total: 1005 },
      { period: "Sem 4", email: 560, teams: 390, whatsapp: 210, total: 1160 },
    ],
    month: [
      { period: "Jul", email: 1800, teams: 1260, whatsapp: 720, total: 3780 },
      { period: "Ago", email: 2100, teams: 1470, whatsapp: 840, total: 4410 },
      { period: "Set", email: 1950, teams: 1365, whatsapp: 780, total: 4095 },
      { period: "Out", email: 2250, teams: 1575, whatsapp: 900, total: 4725 },
      { period: "Nov", email: 2400, teams: 1680, whatsapp: 960, total: 5040 },
      { period: "Dez", email: 2550, teams: 1785, whatsapp: 1020, total: 5355 },
    ],
    quarter: [
      { period: "Q1", email: 5400, teams: 3780, whatsapp: 2160, total: 11340 },
      { period: "Q2", email: 6300, teams: 4410, whatsapp: 2520, total: 13230 },
      { period: "Q3", email: 6750, teams: 4725, whatsapp: 2700, total: 14175 },
      { period: "Q4", email: 7200, teams: 5040, whatsapp: 2880, total: 15120 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateDispatchData(filter: string): ChannelData[] {
  const baseData: Record<string, ChannelData[]> = {
    day: [
      { period: "Seg", email: 1200, teams: 850, whatsapp: 450, total: 2500 },
      { period: "Ter", email: 1350, teams: 920, whatsapp: 480, total: 2750 },
      { period: "Qua", email: 1450, teams: 1000, whatsapp: 520, total: 2970 },
      { period: "Qui", email: 1280, teams: 880, whatsapp: 440, total: 2600 },
      { period: "Sex", email: 1100, teams: 780, whatsapp: 400, total: 2280 },
    ],
    week: [
      { period: "Sem 1", email: 5800, teams: 4060, whatsapp: 2320, total: 12180 },
      { period: "Sem 2", email: 6200, teams: 4340, whatsapp: 2480, total: 13020 },
      { period: "Sem 3", email: 5900, teams: 4130, whatsapp: 2360, total: 12390 },
      { period: "Sem 4", email: 6500, teams: 4550, whatsapp: 2600, total: 13650 },
    ],
    month: [
      { period: "Jul", email: 18500, teams: 12950, whatsapp: 7400, total: 38850 },
      { period: "Ago", email: 21000, teams: 14700, whatsapp: 8400, total: 44100 },
      { period: "Set", email: 19800, teams: 13860, whatsapp: 7920, total: 41580 },
      { period: "Out", email: 22500, teams: 15750, whatsapp: 9000, total: 47250 },
      { period: "Nov", email: 24000, teams: 16800, whatsapp: 9600, total: 50400 },
      { period: "Dez", email: 25500, teams: 17850, whatsapp: 10200, total: 53550 },
    ],
    quarter: [
      { period: "Q1", email: 54000, teams: 37800, whatsapp: 21600, total: 113400 },
      { period: "Q2", email: 63000, teams: 44100, whatsapp: 25200, total: 132300 },
      { period: "Q3", email: 67500, teams: 47250, whatsapp: 27000, total: 141750 },
      { period: "Q4", email: 72000, teams: 50400, whatsapp: 28800, total: 151200 },
    ],
  };

  return baseData[filter] || baseData.month;
}
