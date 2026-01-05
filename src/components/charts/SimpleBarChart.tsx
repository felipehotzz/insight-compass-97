import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface BarData {
  name: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarData[];
  color?: string;
  formatValue?: (value: number) => string;
  height?: number;
  showLabels?: boolean;
}

export function SimpleBarChart({
  data,
  color = "hsl(var(--chart-coral))",
  formatValue = (v) => v.toString(),
  height = 250,
  showLabels = true,
}: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => [formatValue(value), ""]}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]}>
          {showLabels && (
            <LabelList
              dataKey="value"
              position="top"
              formatter={formatValue}
              fill="hsl(var(--foreground))"
              fontSize={12}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
