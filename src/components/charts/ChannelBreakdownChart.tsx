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

// Aggregate data generators for all customers view (General)
export function generateGeneralChannelData(filter: string): ChannelData[] {
  const baseData: Record<string, ChannelData[]> = {
    day: [
      { period: "Seg", email: 5400, teams: 3600, whatsapp: 1800, total: 10800 },
      { period: "Ter", email: 5850, teams: 4050, whatsapp: 2100, total: 12000 },
      { period: "Qua", email: 6300, teams: 4500, whatsapp: 1950, total: 12750 },
      { period: "Qui", email: 5250, teams: 3750, whatsapp: 1650, total: 10650 },
      { period: "Sex", email: 4800, teams: 3300, whatsapp: 1500, total: 9600 },
    ],
    week: [
      { period: "Sem 1", email: 13500, teams: 9450, whatsapp: 5400, total: 28350 },
      { period: "Sem 2", email: 15600, teams: 10500, whatsapp: 5850, total: 31950 },
      { period: "Sem 3", email: 14400, teams: 10200, whatsapp: 5550, total: 30150 },
      { period: "Sem 4", email: 16800, teams: 11700, whatsapp: 6300, total: 34800 },
    ],
    month: [
      { period: "Jul", email: 54000, teams: 37800, whatsapp: 21600, total: 113400 },
      { period: "Ago", email: 63000, teams: 44100, whatsapp: 25200, total: 132300 },
      { period: "Set", email: 58500, teams: 40950, whatsapp: 23400, total: 122850 },
      { period: "Out", email: 67500, teams: 47250, whatsapp: 27000, total: 141750 },
      { period: "Nov", email: 72000, teams: 50400, whatsapp: 28800, total: 151200 },
      { period: "Dez", email: 76500, teams: 53550, whatsapp: 30600, total: 160650 },
    ],
    quarter: [
      { period: "Q1", email: 162000, teams: 113400, whatsapp: 64800, total: 340200 },
      { period: "Q2", email: 189000, teams: 132300, whatsapp: 75600, total: 396900 },
      { period: "Q3", email: 202500, teams: 141750, whatsapp: 81000, total: 425250 },
      { period: "Q4", email: 216000, teams: 151200, whatsapp: 86400, total: 453600 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateGeneralDispatchData(filter: string): ChannelData[] {
  const baseData: Record<string, ChannelData[]> = {
    day: [
      { period: "Seg", email: 36000, teams: 25500, whatsapp: 13500, total: 75000 },
      { period: "Ter", email: 40500, teams: 27600, whatsapp: 14400, total: 82500 },
      { period: "Qua", email: 43500, teams: 30000, whatsapp: 15600, total: 89100 },
      { period: "Qui", email: 38400, teams: 26400, whatsapp: 13200, total: 78000 },
      { period: "Sex", email: 33000, teams: 23400, whatsapp: 12000, total: 68400 },
    ],
    week: [
      { period: "Sem 1", email: 174000, teams: 121800, whatsapp: 69600, total: 365400 },
      { period: "Sem 2", email: 186000, teams: 130200, whatsapp: 74400, total: 390600 },
      { period: "Sem 3", email: 177000, teams: 123900, whatsapp: 70800, total: 371700 },
      { period: "Sem 4", email: 195000, teams: 136500, whatsapp: 78000, total: 409500 },
    ],
    month: [
      { period: "Jul", email: 555000, teams: 388500, whatsapp: 222000, total: 1165500 },
      { period: "Ago", email: 630000, teams: 441000, whatsapp: 252000, total: 1323000 },
      { period: "Set", email: 594000, teams: 415800, whatsapp: 237600, total: 1247400 },
      { period: "Out", email: 675000, teams: 472500, whatsapp: 270000, total: 1417500 },
      { period: "Nov", email: 720000, teams: 504000, whatsapp: 288000, total: 1512000 },
      { period: "Dez", email: 765000, teams: 535500, whatsapp: 306000, total: 1606500 },
    ],
    quarter: [
      { period: "Q1", email: 1620000, teams: 1134000, whatsapp: 648000, total: 3402000 },
      { period: "Q2", email: 1890000, teams: 1323000, whatsapp: 756000, total: 3969000 },
      { period: "Q3", email: 2025000, teams: 1417500, whatsapp: 810000, total: 4252500 },
      { period: "Q4", email: 2160000, teams: 1512000, whatsapp: 864000, total: 4536000 },
    ],
  };

  return baseData[filter] || baseData.month;
}
