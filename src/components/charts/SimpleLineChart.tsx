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

export function SimpleLineChart({ data, height = 200, color = "hsl(var(--color-usage))" }: SimpleLineChartProps) {
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

export function generateMeetingsData(filter: string): SimpleLineData[] {
  const baseData: Record<string, SimpleLineData[]> = {
    day: [
      { period: "Seg", value: 2 },
      { period: "Ter", value: 3 },
      { period: "Qua", value: 1 },
      { period: "Qui", value: 2 },
      { period: "Sex", value: 4 },
    ],
    week: [
      { period: "Sem 1", value: 8 },
      { period: "Sem 2", value: 10 },
      { period: "Sem 3", value: 9 },
      { period: "Sem 4", value: 12 },
    ],
    month: [
      { period: "Jul", value: 8 },
      { period: "Ago", value: 10 },
      { period: "Set", value: 9 },
      { period: "Out", value: 11 },
      { period: "Nov", value: 10 },
      { period: "Dez", value: 12 },
    ],
    quarter: [
      { period: "Q1", value: 28 },
      { period: "Q2", value: 32 },
      { period: "Q3", value: 35 },
      { period: "Q4", value: 39 },
    ],
  };

  return baseData[filter] || baseData.month;
}

// Aggregate data generators for all customers view (General)
export function generateGeneralUsersData(filter: string): SimpleLineData[] {
  const baseData: Record<string, SimpleLineData[]> = {
    day: [
      { period: "Seg", value: 155400 },
      { period: "Ter", value: 155550 },
      { period: "Qua", value: 155700 },
      { period: "Qui", value: 155850 },
      { period: "Sex", value: 156000 },
    ],
    week: [
      { period: "Sem 1", value: 151500 },
      { period: "Sem 2", value: 153000 },
      { period: "Sem 3", value: 154500 },
      { period: "Sem 4", value: 156000 },
    ],
    month: [
      { period: "Jul", value: 144000 },
      { period: "Ago", value: 147000 },
      { period: "Set", value: 150000 },
      { period: "Out", value: 151500 },
      { period: "Nov", value: 153600 },
      { period: "Dez", value: 156000 },
    ],
    quarter: [
      { period: "Q1", value: 126000 },
      { period: "Q2", value: 138000 },
      { period: "Q3", value: 148500 },
      { period: "Q4", value: 156000 },
    ],
  };

  return baseData[filter] || baseData.month;
}

export function generateGeneralCollaboratorsData(filter: string): SimpleLineData[] {
  const baseData: Record<string, SimpleLineData[]> = {
    day: [
      { period: "Seg", value: 98100 },
      { period: "Ter", value: 98200 },
      { period: "Qua", value: 98300 },
      { period: "Qui", value: 98400 },
      { period: "Sex", value: 98500 },
    ],
    week: [
      { period: "Sem 1", value: 96000 },
      { period: "Sem 2", value: 96800 },
      { period: "Sem 3", value: 97650 },
      { period: "Sem 4", value: 98500 },
    ],
    month: [
      { period: "Jul", value: 90000 },
      { period: "Ago", value: 92400 },
      { period: "Set", value: 94500 },
      { period: "Out", value: 96000 },
      { period: "Nov", value: 97200 },
      { period: "Dez", value: 98500 },
    ],
    quarter: [
      { period: "Q1", value: 80000 },
      { period: "Q2", value: 87000 },
      { period: "Q3", value: 93500 },
      { period: "Q4", value: 98500 },
    ],
  };

  return baseData[filter] || baseData.month;
}
