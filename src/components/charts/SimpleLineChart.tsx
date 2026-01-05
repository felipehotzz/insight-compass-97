import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SimpleLineData {
  period: string;
  value: number;
}

interface SimpleLineChartProps {
  data: SimpleLineData[];
  height?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-lg font-medium">{payload[0].value.toLocaleString("pt-BR")}</p>
      </div>
    );
  }
  return null;
};

export function SimpleLineChart({ data, height = 200, color = "hsl(0 0% 60%)" }: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }} />
        <Line 
          type="monotone"
          dataKey="value" 
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 0, r: 4 }}
          activeDot={{ fill: color, strokeWidth: 0, r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Mock data generators
export function generateUsersData(filter: string): SimpleLineData[] {
  const baseData: Record<string, SimpleLineData[]> = {
    day: [
      { period: "Seg", value: 5180 },
      { period: "Ter", value: 5185 },
      { period: "Qua", value: 5190 },
      { period: "Qui", value: 5195 },
      { period: "Sex", value: 5200 },
    ],
    week: [
      { period: "Sem 1", value: 5050 },
      { period: "Sem 2", value: 5100 },
      { period: "Sem 3", value: 5150 },
      { period: "Sem 4", value: 5200 },
    ],
    month: [
      { period: "Jul", value: 4800 },
      { period: "Ago", value: 4900 },
      { period: "Set", value: 5000 },
      { period: "Out", value: 5050 },
      { period: "Nov", value: 5120 },
      { period: "Dez", value: 5200 },
    ],
    quarter: [
      { period: "Q1", value: 4200 },
      { period: "Q2", value: 4600 },
      { period: "Q3", value: 4950 },
      { period: "Q4", value: 5200 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateCollaboratorsData(filter: string): SimpleLineData[] {
  const baseData: Record<string, SimpleLineData[]> = {
    day: [
      { period: "Seg", value: 3780 },
      { period: "Ter", value: 3785 },
      { period: "Qua", value: 3790 },
      { period: "Qui", value: 3795 },
      { period: "Sex", value: 3800 },
    ],
    week: [
      { period: "Sem 1", value: 3700 },
      { period: "Sem 2", value: 3730 },
      { period: "Sem 3", value: 3765 },
      { period: "Sem 4", value: 3800 },
    ],
    month: [
      { period: "Jul", value: 3500 },
      { period: "Ago", value: 3580 },
      { period: "Set", value: 3650 },
      { period: "Out", value: 3700 },
      { period: "Nov", value: 3750 },
      { period: "Dez", value: 3800 },
    ],
    quarter: [
      { period: "Q1", value: 3100 },
      { period: "Q2", value: 3350 },
      { period: "Q3", value: 3600 },
      { period: "Q4", value: 3800 },
    ],
  };

  return baseData[filter] || baseData.month;
}
