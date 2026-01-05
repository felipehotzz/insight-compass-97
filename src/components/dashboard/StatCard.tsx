import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, className }: StatCardProps) {
  const trendDirection = trend?.value ? (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral") : "neutral";

  return (
    <div className={cn("stat-card group", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trendDirection === "up" && "text-success",
              trendDirection === "down" && "text-destructive",
              trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {trendDirection === "up" && <TrendingUp className="h-4 w-4" />}
            {trendDirection === "down" && <TrendingDown className="h-4 w-4" />}
            {trendDirection === "neutral" && <Minus className="h-4 w-4" />}
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          {trend.label && (
            <span className="text-sm text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
