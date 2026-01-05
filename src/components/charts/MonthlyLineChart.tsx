import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  value: number;
  previousValue?: number;
}

interface MonthlyLineChartProps {
  data: MonthlyData[];
  dataKey?: string;
  previousDataKey?: string;
  formatValue?: (value: number) => string;
  color?: string;
  previousColor?: string;
}

export function MonthlyLineChart({
  data,
  dataKey = "value",
  previousDataKey,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  color = "hsl(var(--chart-1))",
  previousColor = "hsl(var(--muted-foreground))",
}: MonthlyLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [formatValue(value), ""]}
        />
        {previousDataKey && (
          <Line
            type="monotone"
            dataKey={previousDataKey}
            stroke={previousColor}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Período Anterior"
          />
        )}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: color }}
          name="Atual"
        />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}
