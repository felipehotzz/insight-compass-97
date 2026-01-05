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

interface StackedBarData {
  name: string;
  [key: string]: string | number;
}

interface DataSeries {
  key: string;
  name: string;
  color: string;
}

interface StackedBarChartProps {
  data: StackedBarData[];
  series: DataSeries[];
  formatValue?: (value: number) => string;
  height?: number;
}

export function StackedBarChart({
  data,
  series,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  height = 350,
}: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          angle={-15}
          textAnchor="end"
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
          formatter={(value: number, name: string) => [formatValue(value), name]}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: "16px",
          }}
          formatter={(value) => (
            <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>{value}</span>
          )}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="a"
            fill={s.color}
            name={s.name}
            radius={series.indexOf(s) === series.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
