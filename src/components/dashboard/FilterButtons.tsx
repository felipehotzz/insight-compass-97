import { cn } from "@/lib/utils";

type TimeFilter = "day" | "week" | "month" | "quarter";

interface FilterButtonsProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  className?: string;
}

const filters: { value: TimeFilter; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "quarter", label: "Trimestre" },
];

export function FilterButtons({ value, onChange, className }: FilterButtonsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
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
  );
}

export type { TimeFilter };
