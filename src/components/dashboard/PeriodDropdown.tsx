import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type PeriodFilter = "today" | "this_week" | "this_month" | "last_3_months" | "this_year" | "all";

interface PeriodDropdownProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
  className?: string;
}

const periods: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "this_week", label: "Esta semana" },
  { value: "this_month", label: "Este mês" },
  { value: "last_3_months", label: "Últimos 3 meses" },
  { value: "this_year", label: "Este ano" },
  { value: "all", label: "Todo o período" },
];

export function PeriodDropdown({ value, onChange, className }: PeriodDropdownProps) {
  const selectedPeriod = periods.find(p => p.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 gap-1 text-xs font-medium bg-background border-border hover:bg-muted ${className}`}
        >
          {selectedPeriod?.label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border z-50">
        {periods.map((period) => (
          <DropdownMenuItem
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`text-xs cursor-pointer ${value === period.value ? "bg-muted" : ""}`}
          >
            {period.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to get date range from period
export function getDateRangeFromPeriod(period: PeriodFilter): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { startDate: today, endDate: now };
    case "this_week": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { startDate: startOfWeek, endDate: now };
    }
    case "this_month": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: startOfMonth, endDate: now };
    }
    case "last_3_months": {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return { startDate: threeMonthsAgo, endDate: now };
    }
    case "this_year": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { startDate: startOfYear, endDate: now };
    }
    case "all":
    default:
      return { startDate: null, endDate: null };
  }
}
