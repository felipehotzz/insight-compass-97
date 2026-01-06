import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
import { getDateRangeFromPeriod } from "@/components/dashboard/PeriodDropdown";
import { format, subDays, subWeeks, subMonths, subQuarters, startOfDay, startOfWeek, startOfMonth, startOfQuarter, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupportData {
  period: string;
  n1: number;
  n2: number;
  n3: number;
  total: number;
}

interface TicketsByCustomer {
  name: string;
  value: number;
}

// Get date range and period config based on filter and period
const getFilterConfig = (filter: TimeFilter, periodFilter: PeriodFilter = "last_3_months") => {
  const now = new Date();
  const { startDate: periodStartDate } = getDateRangeFromPeriod(periodFilter);
  
  // Use the period filter to determine the base date range
  const baseStartDate = periodStartDate || subMonths(now, 12); // Default to 12 months if "all"
  
  switch (filter) {
    case "day":
      return {
        startDate: baseStartDate,
        getKey: (date: Date) => format(date, "yyyy-MM-dd"),
        getLabel: (date: Date) => format(date, "dd/MM", { locale: ptBR }),
        getPeriods: (start: Date, end: Date) => 
          eachDayOfInterval({ start, end }).map(d => ({
            key: format(d, "yyyy-MM-dd"),
            label: format(d, "dd/MM", { locale: ptBR })
          }))
      };
    case "week":
      return {
        startDate: baseStartDate,
        getKey: (date: Date) => format(startOfWeek(date, { weekStartsOn: 0 }), "yyyy-MM-dd"),
        getLabel: (date: Date) => `Sem ${format(date, "w")}`,
        getPeriods: (start: Date, end: Date) => 
          eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).map(d => ({
            key: format(d, "yyyy-MM-dd"),
            label: `Sem ${format(d, "w")}`
          }))
      };
    case "month":
      return {
        startDate: baseStartDate,
        getKey: (date: Date) => format(date, "yyyy-MM"),
        getLabel: (date: Date) => format(date, "MMM", { locale: ptBR }),
        getPeriods: (start: Date, end: Date) => 
          eachMonthOfInterval({ start, end }).map(d => ({
            key: format(d, "yyyy-MM"),
            label: format(d, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(d, "MMM", { locale: ptBR }).slice(1)
          }))
      };
    case "quarter":
      return {
        startDate: baseStartDate,
        getKey: (date: Date) => `${format(date, "yyyy")}-Q${Math.ceil((date.getMonth() + 1) / 3)}`,
        getLabel: (date: Date) => `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, "yy")}`,
        getPeriods: (start: Date, end: Date) => 
          eachQuarterOfInterval({ start, end }).map(d => ({
            key: `${format(d, "yyyy")}-Q${Math.ceil((d.getMonth() + 1) / 3)}`,
            label: `Q${Math.ceil((d.getMonth() + 1) / 3)} ${format(d, "yy")}`
          }))
      };
    default:
      return {
        startDate: baseStartDate,
        getKey: (date: Date) => format(date, "yyyy-MM"),
        getLabel: (date: Date) => format(date, "MMM", { locale: ptBR }),
        getPeriods: (start: Date, end: Date) => 
          eachMonthOfInterval({ start, end }).map(d => ({
            key: format(d, "yyyy-MM"),
            label: format(d, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(d, "MMM", { locale: ptBR }).slice(1)
          }))
      };
  }
};

export const useSupportMetrics = (filter: TimeFilter, periodFilter: PeriodFilter = "last_3_months") => {
  const filterConfig = getFilterConfig(filter, periodFilter);

  // Fetch all ticket data
  const { data: ticketData, isLoading: ticketLoading } = useQuery({
    queryKey: ["support-ticket-data", filter, periodFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("created_at, closed_at, status, priority")
        .gte("created_at", filterConfig.startDate.toISOString())
        .or("archived.is.null,archived.eq.false");

      if (error) throw error;
      return data;
    },
  });

  // Fetch tickets by customer
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["support-by-customer", filter, periodFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          id,
          customer_id,
          customers!inner(nome_fantasia)
        `)
        .gte("created_at", filterConfig.startDate.toISOString())
        .or("archived.is.null,archived.eq.false")
        .not("customer_id", "is", null);

      if (error) throw error;
      return data;
    },
  });

  // Process data for charts based on filter
  const processData = () => {
    if (!ticketData) return { opened: [], closed: [], backlog: [] };

    const periods = filterConfig.getPeriods(filterConfig.startDate, new Date());

    // Initialize data structure
    const periodData = new Map<string, { opened: { n1: number; n2: number; n3: number }; closed: { n1: number; n2: number; n3: number } }>();
    periods.forEach(p => {
      periodData.set(p.key, {
        opened: { n1: 0, n2: 0, n3: 0 },
        closed: { n1: 0, n2: 0, n3: 0 },
      });
    });

    // Process tickets
    ticketData.forEach((ticket) => {
      const createdKey = filterConfig.getKey(new Date(ticket.created_at));
      
      if (periodData.has(createdKey)) {
        const entry = periodData.get(createdKey)!;
        
        // Map priority: priority -> n3, n2 -> n2, everything else -> n1
        const priorityKey = ticket.priority === "priority" ? "n3" : ticket.priority === "n2" ? "n2" : "n1";
        
        entry.opened[priorityKey]++;
        
        // Count closed tickets in the period they were closed
        if (ticket.status === "closed" && ticket.closed_at) {
          const closedKey = filterConfig.getKey(new Date(ticket.closed_at));
          if (periodData.has(closedKey)) {
            periodData.get(closedKey)!.closed[priorityKey]++;
          }
        }
      }
    });

    // Build result arrays
    const opened: SupportData[] = [];
    const closed: SupportData[] = [];
    const backlog: SupportData[] = [];

    let runningBacklog = { n1: 0, n2: 0, n3: 0 };

    periods.forEach((period) => {
      const entry = periodData.get(period.key);
      if (entry) {
        const openedTotal = entry.opened.n1 + entry.opened.n2 + entry.opened.n3;
        const closedTotal = entry.closed.n1 + entry.closed.n2 + entry.closed.n3;
        
        opened.push({ 
          period: period.label, 
          n1: entry.opened.n1,
          n2: entry.opened.n2,
          n3: entry.opened.n3,
          total: openedTotal
        });
        
        closed.push({ 
          period: period.label, 
          n1: entry.closed.n1,
          n2: entry.closed.n2,
          n3: entry.closed.n3,
          total: closedTotal
        });
        
        // Calculate running backlog (cumulative open - closed)
        runningBacklog.n1 += entry.opened.n1 - entry.closed.n1;
        runningBacklog.n2 += entry.opened.n2 - entry.closed.n2;
        runningBacklog.n3 += entry.opened.n3 - entry.closed.n3;
        
        // Ensure no negative values
        runningBacklog.n1 = Math.max(0, runningBacklog.n1);
        runningBacklog.n2 = Math.max(0, runningBacklog.n2);
        runningBacklog.n3 = Math.max(0, runningBacklog.n3);
        
        backlog.push({ 
          period: period.label, 
          n1: runningBacklog.n1,
          n2: runningBacklog.n2,
          n3: runningBacklog.n3,
          total: runningBacklog.n1 + runningBacklog.n2 + runningBacklog.n3
        });
      }
    });

    return { opened, closed, backlog };
  };

  // Process tickets by customer
  const processCustomerData = (): TicketsByCustomer[] => {
    if (!customerData) return [];

    const customerCounts = new Map<string, number>();

    customerData.forEach((ticket) => {
      const customerName = (ticket.customers as { nome_fantasia: string })?.nome_fantasia || "Desconhecido";
      customerCounts.set(customerName, (customerCounts.get(customerName) || 0) + 1);
    });

    return Array.from(customerCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const { opened, closed, backlog } = processData();
  const ticketsByCustomer = processCustomerData();

  return {
    openedTickets: opened,
    closedTickets: closed,
    backlogTickets: backlog,
    ticketsByCustomer,
    isLoading: ticketLoading || customerLoading,
  };
};
