import { useMemo } from "react";

interface FunnelStep {
  name: string;
  value: number;
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

  return (
    <div className="space-y-2.5">
      {data.map((step, index) => {
        const width = (step.value / maxValue) * 100;
        const prevValue = index > 0 ? data[index - 1].value : step.value;
        const conversionRate = index > 0 ? ((step.value / prevValue) * 100).toFixed(1) : "100";
        const opacity = 0.9 - (index * 0.1);

        return (
          <div key={step.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{step.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-foreground/80">
                  {formatValue(step.value)}
                </span>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-6 w-full bg-secondary/30 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${width}%`,
                  backgroundColor: `hsl(0 0% ${70 - (index * 5)}%)`,
                  opacity,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
