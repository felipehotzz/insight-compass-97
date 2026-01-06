import { cn } from "@/lib/utils";
import { PeriodDropdown, PeriodFilter } from "./PeriodDropdown";

type TimeFilter = "day" | "week" | "month" | "quarter";

interface FilterButtonsProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  periodValue?: PeriodFilter;
  onPeriodChange?: (value: PeriodFilter) => void;
  showPeriodSelector?: boolean;
  className?: string;
}

const filters: { value: TimeFilter; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "quarter", label: "Trimestre" },
];

export function FilterButtons({ 
  value, 
  onChange, 
  periodValue = "last_3_months",
  onPeriodChange,
  showPeriodSelector = true,
  className 
}: FilterButtonsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showPeriodSelector && onPeriodChange && (
        <PeriodDropdown value={periodValue} onChange={onPeriodChange} />
      )}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={cn(
              "filter-button",
              value === filter.value && "filter-button-active"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { TimeFilter };
export type { PeriodFilter } from "./PeriodDropdown";
