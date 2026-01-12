import { useMemo } from "react";
import { format, startOfWeek, startOfMonth, startOfQuarter, subDays, subWeeks, subMonths, subQuarters, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";

interface Action {
  id: string;
  title: string;
  customer: string;
  action_type: string;
  category: string | null;
  action_date: string;
}

interface ActionTypeData {
  period: string;
  reuniao: number;
  email: number;
  ligacao: number;
  whatsapp: number;
  total: number;
}

interface ActionThemeData {
  period: string;
  renovacao: number;
  expansao: number;
  onboarding: number;
  contencao: number;
  suporte: number;
  tecnica: number;
  relacionamento: number;
  total: number;
}

// Normalize action_type to match chart keys
const normalizeActionType = (actionType: string): keyof Omit<ActionTypeData, 'period' | 'total'> | null => {
  const normalized = actionType.toLowerCase().trim();
  if (normalized.includes('reunião') || normalized.includes('reuniao') || normalized === 'meeting') return 'reuniao';
  if (normalized.includes('email') || normalized.includes('e-mail')) return 'email';
  if (normalized.includes('ligação') || normalized.includes('ligacao') || normalized.includes('call') || normalized.includes('telefone')) return 'ligacao';
  if (normalized.includes('whatsapp') || normalized.includes('wpp') || normalized.includes('mensagem')) return 'whatsapp';
  return null;
};

// Normalize category to match chart keys  
const normalizeCategory = (category: string | null): keyof Omit<ActionThemeData, 'period' | 'total'> | null => {
  if (!category) return null;
  const normalized = category.toLowerCase().trim();
  if (normalized.includes('renovação') || normalized.includes('renovacao')) return 'renovacao';
  if (normalized.includes('expansão') || normalized.includes('expansao')) return 'expansao';
  if (normalized.includes('onboarding') || normalized.includes('implantação') || normalized.includes('implantacao')) return 'onboarding';
  if (normalized.includes('contenção') || normalized.includes('contencao') || normalized.includes('churn')) return 'contencao';
  if (normalized.includes('suporte')) return 'suporte';
  if (normalized.includes('técnica') || normalized.includes('tecnica') || normalized.includes('técnico')) return 'tecnica';
  if (normalized.includes('relacionamento') || normalized.includes('acompanhamento')) return 'relacionamento';
  return null;
};

// Get date range based on filter and period
const getDateRange = (filter: TimeFilter, periodValue: PeriodFilter): { start: Date; end: Date } => {
  const now = new Date();
  let start: Date;
  
  switch (periodValue) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "this_week":
      start = startOfWeek(now, { locale: ptBR });
      break;
    case "this_month":
      start = startOfMonth(now);
      break;
    case "last_3_months":
      start = subMonths(now, 3);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
      start = new Date(2020, 0, 1); // Far enough back to include all data
      break;
    default:
      start = subMonths(now, 3);
  }
  
  return { start, end: now };
};

// Generate period buckets based on filter
const generatePeriodBuckets = (filter: TimeFilter, dateRange: { start: Date; end: Date }): { key: string; label: string; start: Date; end: Date }[] => {
  const buckets: { key: string; label: string; start: Date; end: Date }[] = [];
  const { start, end } = dateRange;
  
  switch (filter) {
    case "day": {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(end, i);
        buckets.push({
          key: format(date, "yyyy-MM-dd"),
          label: format(date, "EEE", { locale: ptBR }),
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999)),
        });
      }
      break;
    }
    case "week": {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(end, i), { locale: ptBR });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        buckets.push({
          key: format(weekStart, "yyyy-'W'ww"),
          label: `Sem ${4 - i}`,
          start: weekStart,
          end: weekEnd,
        });
      }
      break;
    }
    case "month": {
      let current = startOfMonth(start);
      while (current <= end) {
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
        buckets.push({
          key: format(current, "yyyy-MM"),
          label: format(current, "MMM", { locale: ptBR }),
          start: new Date(current),
          end: monthEnd,
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      break;
    }
    case "quarter": {
      let current = startOfQuarter(start);
      while (current <= end) {
        const quarterEnd = new Date(current);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        quarterEnd.setDate(0);
        quarterEnd.setHours(23, 59, 59, 999);
        const quarterNum = Math.floor(current.getMonth() / 3) + 1;
        buckets.push({
          key: `${current.getFullYear()}-Q${quarterNum}`,
          label: `Q${quarterNum}`,
          start: new Date(current),
          end: quarterEnd,
        });
        current = new Date(current.getFullYear(), current.getMonth() + 3, 1);
      }
      break;
    }
  }
  
  return buckets;
};

export function useActionChartData(
  actions: Action[],
  filter: TimeFilter,
  periodValue: PeriodFilter
) {
  return useMemo(() => {
    const dateRange = getDateRange(filter, periodValue);
    const buckets = generatePeriodBuckets(filter, dateRange);
    
    // Initialize data structures
    const typeData: ActionTypeData[] = buckets.map(b => ({
      period: b.label,
      reuniao: 0,
      email: 0,
      ligacao: 0,
      whatsapp: 0,
      total: 0,
    }));
    
    const themeData: ActionThemeData[] = buckets.map(b => ({
      period: b.label,
      renovacao: 0,
      expansao: 0,
      onboarding: 0,
      contencao: 0,
      suporte: 0,
      tecnica: 0,
      relacionamento: 0,
      total: 0,
    }));
    
    // Process each action
    actions.forEach(action => {
      try {
        const actionDate = parseISO(action.action_date);
        
        // Find which bucket this action belongs to
        const bucketIndex = buckets.findIndex(bucket => 
          isWithinInterval(actionDate, { start: bucket.start, end: bucket.end })
        );
        
        if (bucketIndex === -1) return;
        
        // Update type data
        const normalizedType = normalizeActionType(action.action_type);
        if (normalizedType) {
          typeData[bucketIndex][normalizedType]++;
          typeData[bucketIndex].total++;
        }
        
        // Update theme data
        const normalizedCategory = normalizeCategory(action.category);
        if (normalizedCategory) {
          themeData[bucketIndex][normalizedCategory]++;
          themeData[bucketIndex].total++;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return { typeData, themeData };
  }, [actions, filter, periodValue]);
}
