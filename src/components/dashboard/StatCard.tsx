import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  sparklineData?: { value: number }[];
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, sparklineData, className }: StatCardProps) {
  const trendDirection = trend?.value ? (trend.value > 0 ? "up" : "down") : null;

  return (
    <div className={cn("stat-card", className)}>
      <p className="stat-label">{title}</p>
      <p className="stat-value">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                fill="url(#sparklineGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {trend && trendDirection && (
        <div className="mt-2 flex items-center gap-1.5">
          {trendDirection === "up" && <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
          {trendDirection === "down" && <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground">
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
