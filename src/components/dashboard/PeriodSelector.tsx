import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type PeriodPreset = "6m" | "12m" | "24m" | "all" | "custom";

interface PeriodSelectorProps {
  value: PeriodPreset;
  onChange: (preset: PeriodPreset) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start: Date | undefined, end: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}

const presetOptions = [
  { value: "6m", label: "Últimos 6 meses" },
  { value: "12m", label: "Últimos 12 meses" },
  { value: "24m", label: "Últimos 24 meses" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Período personalizado" },
];

export function PeriodSelector({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  minDate,
  maxDate,
}: PeriodSelectorProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handlePresetChange = (preset: string) => {
    onChange(preset as PeriodPreset);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px] bg-secondary/50 border-border">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <div className="flex items-center gap-2">
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal bg-secondary/50",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate
                  ? format(customStartDate, "MMM/yy", { locale: ptBR })
                  : "Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => {
                  onCustomDateChange?.(date, customEndDate);
                  setIsStartOpen(false);
                }}
                disabled={(date) => {
                  if (minDate && date < minDate) return true;
                  if (customEndDate && date > customEndDate) return true;
                  return false;
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal bg-secondary/50",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate
                  ? format(customEndDate, "MMM/yy", { locale: ptBR })
                  : "Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => {
                  onCustomDateChange?.(customStartDate, date);
                  setIsEndOpen(false);
                }}
                disabled={(date) => {
                  if (maxDate && date > maxDate) return true;
                  if (customStartDate && date < customStartDate) return true;
                  return false;
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

export function getDateRangeFromPreset(
  preset: PeriodPreset,
  customStart?: Date,
  customEnd?: Date
): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  const endDate = startOfMonth(now);

  switch (preset) {
    case "6m":
      return { startDate: subMonths(endDate, 5), endDate };
    case "12m":
      return { startDate: subMonths(endDate, 11), endDate };
    case "24m":
      return { startDate: subMonths(endDate, 23), endDate };
    case "all":
      return { startDate: null, endDate: null };
    case "custom":
      return {
        startDate: customStart || null,
        endDate: customEnd || null,
      };
    default:
      return { startDate: subMonths(endDate, 11), endDate };
  }
}