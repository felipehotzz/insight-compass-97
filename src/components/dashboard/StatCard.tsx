import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, className }: StatCardProps) {
  const trendDirection = trend?.value ? (trend.value > 0 ? "up" : "down") : null;

  return (
    <div className={cn("stat-card", className)}>
      <p className="stat-label">{title}</p>
      <p className="stat-value">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      
      {trend && trendDirection && (
        <div className="mt-3 flex items-center gap-1.5">
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
