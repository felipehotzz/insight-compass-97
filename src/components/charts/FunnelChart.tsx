import { useMemo } from "react";

interface FunnelStep {
  name: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
  formatValue?: (value: number) => string;
}

export function FunnelChart({
  data,
  formatValue = (v) => v.toLocaleString("pt-BR"),
}: FunnelChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-3">
      {data.map((step, index) => {
        const width = (step.value / maxValue) * 100;
        const prevValue = index > 0 ? data[index - 1].value : step.value;
        const conversionRate = index > 0 ? ((step.value / prevValue) * 100).toFixed(1) : "100";
        const color = step.color || colors[index % colors.length];

        return (
          <div key={step.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{step.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {formatValue(step.value)}
                </span>
                {index > 0 && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 w-full bg-secondary/50 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-3"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                }}
              >
                <span className="text-xs font-medium text-white/90">
                  {formatValue(step.value)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
