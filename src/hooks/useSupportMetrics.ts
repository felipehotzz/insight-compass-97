import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimeFilter } from "@/components/dashboard/FilterButtons";
import { format, subMonths } from "date-fns";
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

export const useSupportMetrics = (filter: TimeFilter) => {
  // Calculate start date - get last 12 months to ensure we have all data
  const startDate = subMonths(new Date(), 12);

  // Fetch all ticket data
  const { data: ticketData, isLoading: ticketLoading } = useQuery({
    queryKey: ["support-ticket-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("created_at, closed_at, status, priority")
        .gte("created_at", "2025-01-01")
        .or("archived.is.null,archived.eq.false");

      if (error) throw error;
      return data;
    },
  });

  // Fetch tickets by customer
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["support-by-customer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          id,
          customer_id,
          customers!inner(nome_fantasia)
        `)
        .gte("created_at", "2025-01-01")
        .or("archived.is.null,archived.eq.false")
        .not("customer_id", "is", null);

      if (error) throw error;
      return data;
    },
  });

  // Process monthly data for charts
  const processMonthlyData = () => {
    if (!ticketData) return { opened: [], closed: [], backlog: [] };

    // Generate last 6 months
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthKey = format(d, "yyyy-MM");
      const label = format(d, "MMM", { locale: ptBR });
      months.push({ 
        key: monthKey, 
        label: label.charAt(0).toUpperCase() + label.slice(1) 
      });
    }

    // Initialize data structure
    const monthData = new Map<string, { opened: { n1: number; n2: number; n3: number }; closed: { n1: number; n2: number; n3: number } }>();
    months.forEach(m => {
      monthData.set(m.key, {
        opened: { n1: 0, n2: 0, n3: 0 },
        closed: { n1: 0, n2: 0, n3: 0 },
      });
    });

    // Process tickets
    ticketData.forEach((ticket) => {
      const createdMonthKey = format(new Date(ticket.created_at), "yyyy-MM");
      
      if (monthData.has(createdMonthKey)) {
        const entry = monthData.get(createdMonthKey)!;
        
        // Map priority: priority -> n3, n2 -> n2, everything else -> n1
        const priorityKey = ticket.priority === "priority" ? "n3" : ticket.priority === "n2" ? "n2" : "n1";
        
        entry.opened[priorityKey]++;
        
        // Count closed tickets in the month they were closed
        if (ticket.status === "closed" && ticket.closed_at) {
          const closedMonthKey = format(new Date(ticket.closed_at), "yyyy-MM");
          if (monthData.has(closedMonthKey)) {
            monthData.get(closedMonthKey)!.closed[priorityKey]++;
          }
        }
      }
    });

    // Build result arrays
    const opened: SupportData[] = [];
    const closed: SupportData[] = [];
    const backlog: SupportData[] = [];

    let runningBacklog = { n1: 0, n2: 0, n3: 0 };

    months.forEach((month) => {
      const entry = monthData.get(month.key);
      if (entry) {
        const openedTotal = entry.opened.n1 + entry.opened.n2 + entry.opened.n3;
        const closedTotal = entry.closed.n1 + entry.closed.n2 + entry.closed.n3;
        
        opened.push({ 
          period: month.label, 
          n1: entry.opened.n1,
          n2: entry.opened.n2,
          n3: entry.opened.n3,
          total: openedTotal
        });
        
        closed.push({ 
          period: month.label, 
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
          period: month.label, 
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

  const { opened, closed, backlog } = processMonthlyData();
  const ticketsByCustomer = processCustomerData();

  return {
    openedTickets: opened,
    closedTickets: closed,
    backlogTickets: backlog,
    ticketsByCustomer,
    isLoading: ticketLoading || customerLoading,
  };
};
