import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface MonthlyData {
  month: string;
  value: number;
}

interface MonthlyBarChartProps {
  data: MonthlyData[];
  formatValue?: (value: number) => string;
  color?: string;
  height?: number;
  colorByValue?: boolean; // When true, uses green for positive, red for negative
}

export function MonthlyBarChart({
  data,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  color = "hsl(var(--chart-1))",
  height = 300,
  colorByValue = false,
}: MonthlyBarChartProps) {
  const hasNegativeValues = data.some(d => d.value < 0);
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
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
          formatter={(value: number) => [formatValue(value), "Valor"]}
        />
        {hasNegativeValues && (
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        )}
        <Bar
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        >
          {colorByValue && data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.value >= 0 ? "hsl(var(--color-growth))" : "hsl(var(--color-danger))"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}