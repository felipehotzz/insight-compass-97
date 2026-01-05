import {
  ComposedChart,
  Bar,
  Line,
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
  showTotalLine?: boolean;
  totalLabel?: string;
}

// Custom tooltip to show total at the end
const CustomTooltip = ({ 
  active, 
  payload, 
  label, 
  formatValue,
  showTotal,
  totalLabel,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>;
  label?: string;
  formatValue: (v: number) => string;
  showTotal: boolean;
  totalLabel: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  // Filter out the _total line from the payload
  const filteredPayload = payload.filter(entry => entry.dataKey !== "_total");
  const total = filteredPayload.reduce((sum, entry) => sum + (entry.value || 0), 0);

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        padding: "8px 12px",
      }}
    >
      <p style={{ fontWeight: 500, marginBottom: "4px", color: "hsl(var(--foreground))" }}>{label}</p>
      {filteredPayload.map((entry, index) => (
        <p key={index} style={{ color: entry.color, fontSize: "13px" }}>
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
      {showTotal && (
        <p style={{ color: "hsl(var(--primary))", fontSize: "13px", fontWeight: 500, marginTop: "4px", borderTop: "1px solid hsl(var(--border))", paddingTop: "4px" }}>
          {totalLabel}: {formatValue(total)}
        </p>
      )}
    </div>
  );
};

export function StackedBarChart({
  data,
  series,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  height = 350,
  showTotalLine = false,
  totalLabel = "Total",
}: StackedBarChartProps) {
  // Add total to each data point for the line
  const dataWithTotal = data.map(item => {
    const total = series.reduce((sum, s) => sum + (Number(item[s.key]) || 0), 0);
    return { ...item, _total: total };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={dataWithTotal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          angle={0}
          textAnchor="middle"
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} showTotal={showTotalLine} totalLabel={totalLabel} />}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: "16px",
          }}
          formatter={(value) => (
            <span style={{ color: "hsl(var(--foreground))", fontSize: "12px" }}>{value}</span>
          )}
        />
        {series.map((s, index) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="a"
            fill={s.color}
            name={s.name}
            radius={index === series.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
        {showTotalLine && (
          <Line
            type="monotone"
            dataKey="_total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            name={totalLabel}
            legendType="none"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
