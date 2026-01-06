import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterButtons } from "@/components/dashboard/FilterButtons";
import type { TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
import { getDateRangeFromPeriod } from "@/components/dashboard/PeriodDropdown";
import { SupportBreakdownChart } from "@/components/charts/SupportBreakdownChart";
import { ChartCard } from "@/components/dashboard/ChartCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, subDays, subWeeks, subMonths, subQuarters, startOfWeek, startOfMonth, startOfQuarter, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, User, Headphones, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface SupportTicketsSectionProps {
  customerId: string;
  filter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  periodValue?: PeriodFilter;
  onPeriodChange?: (period: PeriodFilter) => void;
}

interface Ticket {
  id: string;
  intercom_conversation_id: string;
  from_email: string | null;
  from_name: string | null;
  subject: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  closed_at: string | null;
  assignee_name: string | null;
}

interface Message {
  id: string;
  author_type: string;
  author_name: string | null;
  body: string | null;
  created_at: string;
}

interface SupportData {
  period: string;
  n1: number;
  n2: number;
  n3: number;
  total: number;
}

const getDateRange = (filter: TimeFilter) => {
  const now = new Date();
  switch (filter) {
    case "day":
      return subDays(now, 1);
    case "week":
      return subWeeks(now, 1);
    case "month":
      return subMonths(now, 1);
    case "quarter":
      return subQuarters(now, 1);
    default:
      return subMonths(now, 1);
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-yellow-500/20 text-yellow-500";
    case "closed":
      return "bg-green-500/20 text-green-500";
    case "snoozed":
      return "bg-blue-500/20 text-blue-500";
    default:
      return "";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "open":
      return "Aberto";
    case "closed":
      return "Fechado";
    case "snoozed":
      return "Adiado";
    default:
      return status;
  }
};

const getPriorityColor = (priority: string | null) => {
  switch (priority?.toLowerCase()) {
    case "n1":
      return "bg-red-500/20 text-red-500";
    case "n2":
      return "bg-orange-500/20 text-orange-500";
    case "n3":
      return "bg-blue-500/20 text-blue-500";
    case "not_priority":
      return "bg-muted/50 text-muted-foreground border-0";
    default:
      return "bg-muted/50 text-muted-foreground border-0";
  }
};

const getPriorityLabel = (priority: string | null) => {
  switch (priority?.toLowerCase()) {
    case "n1":
      return "N1";
    case "n2":
      return "N2";
    case "n3":
      return "N3";
    case "not_priority":
      return "-";
    default:
      return priority?.toUpperCase() || "-";
  }
};

export const SupportTicketsSection = ({ customerId, filter, onFilterChange, periodValue = "last_3_months", onPeriodChange }: SupportTicketsSectionProps) => {
  const queryClient = useQueryClient();
  const { startDate: periodStartDate } = getDateRangeFromPeriod(periodValue);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chartFilter, setChartFilter] = useState<{ period: string; priority: string; type: 'opened' | 'closed' | 'backlog' } | null>(null);
  // Sync ALL tickets from Intercom (not filtered by customer)
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-intercom-tickets", {
        body: { limit: 100 }, // Don't filter by customerId - sync all
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets-backlog"] });
      toast.success(`Sincronizado: ${data.synced} tickets (${data.linkedToCustomers} vinculados a clientes)`);
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  // Fetch conversation messages from Intercom
  const fetchConversation = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsLoadingMessages(true);
    setConversationMessages([]);

    try {
      const { data, error } = await supabase.functions.invoke("get-intercom-conversation", {
        body: { conversationId: ticket.intercom_conversation_id },
      });
      if (error) throw error;
      setConversationMessages(data.conversation?.messages || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch tickets for this customer based on period filter
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets", customerId, periodValue],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      
      // Apply period filter if not "all"
      if (periodStartDate) {
        query = query.gte("created_at", periodStartDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!customerId,
  });

  // Fetch all open tickets (backlog) for this customer
  const { data: backlogTickets } = useQuery({
    queryKey: ["support-tickets-backlog", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("customer_id", customerId)
        .neq("status", "closed");
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!customerId,
  });

  // Get period configuration based on granularity filter
  const getFilterConfig = (timeFilter: TimeFilter) => {
    const now = new Date();
    const { startDate: periodStart } = getDateRangeFromPeriod(periodValue);
    const baseStartDate = periodStart || subMonths(now, 12);

    switch (timeFilter) {
      case "day":
        return {
          startDate: baseStartDate,
          getKey: (date: Date) => format(date, "yyyy-MM-dd"),
          getLabel: (date: Date) => format(date, "dd/MM", { locale: ptBR }),
          getPeriods: (start: Date, end: Date) =>
            eachDayOfInterval({ start, end }).map((d) => ({
              key: format(d, "yyyy-MM-dd"),
              label: format(d, "dd/MM", { locale: ptBR }),
            })),
        };
      case "week":
        return {
          startDate: baseStartDate,
          getKey: (date: Date) => format(startOfWeek(date, { weekStartsOn: 0 }), "yyyy-MM-dd"),
          getLabel: (date: Date) => `Sem ${format(date, "w")}`,
          getPeriods: (start: Date, end: Date) =>
            eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).map((d) => ({
              key: format(d, "yyyy-MM-dd"),
              label: `Sem ${format(d, "w")}`,
            })),
        };
      case "month":
        return {
          startDate: baseStartDate,
          getKey: (date: Date) => format(date, "yyyy-MM"),
          getLabel: (date: Date) => format(date, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(date, "MMM", { locale: ptBR }).slice(1),
          getPeriods: (start: Date, end: Date) =>
            eachMonthOfInterval({ start, end }).map((d) => ({
              key: format(d, "yyyy-MM"),
              label: format(d, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(d, "MMM", { locale: ptBR }).slice(1),
            })),
        };
      case "quarter":
        return {
          startDate: baseStartDate,
          getKey: (date: Date) => `${format(date, "yyyy")}-Q${Math.ceil((date.getMonth() + 1) / 3)}`,
          getLabel: (date: Date) => `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, "yy")}`,
          getPeriods: (start: Date, end: Date) =>
            eachQuarterOfInterval({ start, end }).map((d) => ({
              key: `${format(d, "yyyy")}-Q${Math.ceil((d.getMonth() + 1) / 3)}`,
              label: `Q${Math.ceil((d.getMonth() + 1) / 3)} ${format(d, "yy")}`,
            })),
        };
      default:
        return {
          startDate: baseStartDate,
          getKey: (date: Date) => format(date, "yyyy-MM"),
          getLabel: (date: Date) => format(date, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(date, "MMM", { locale: ptBR }).slice(1),
          getPeriods: (start: Date, end: Date) =>
            eachMonthOfInterval({ start, end }).map((d) => ({
              key: format(d, "yyyy-MM"),
              label: format(d, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(d, "MMM", { locale: ptBR }).slice(1),
            })),
        };
    }
  };

  // Calculate chart data from real tickets grouped by period
  const chartData = useMemo(() => {
    if (!tickets) return { opened: [], closed: [], backlog: [] };

    const filterConfig = getFilterConfig(filter);
    const now = new Date();
    const periods = filterConfig.getPeriods(filterConfig.startDate, now);

    // Initialize data structure for each period
    const periodData = new Map<
      string,
      { opened: { n1: number; n2: number; n3: number }; closed: { n1: number; n2: number; n3: number } }
    >();
    periods.forEach((p) => {
      periodData.set(p.key, {
        opened: { n1: 0, n2: 0, n3: 0 },
        closed: { n1: 0, n2: 0, n3: 0 },
      });
    });

    // Process tickets
    for (const ticket of tickets) {
      const createdKey = filterConfig.getKey(new Date(ticket.created_at));

      if (periodData.has(createdKey)) {
        const entry = periodData.get(createdKey)!;
        // Map priority: not_priority -> n1, n2 -> n2, n3/priority -> n3
        let priorityKey: "n1" | "n2" | "n3" = "n2";
        const priority = ticket.priority?.toLowerCase();
        if (priority === "n1" || priority === "not_priority") priorityKey = "n1";
        else if (priority === "n2") priorityKey = "n2";
        else if (priority === "n3" || priority === "priority") priorityKey = "n3";

        entry.opened[priorityKey]++;

        // Count closed tickets in the period they were closed
        if (ticket.status === "closed" && ticket.closed_at) {
          const closedKey = filterConfig.getKey(new Date(ticket.closed_at));
          if (periodData.has(closedKey)) {
            periodData.get(closedKey)!.closed[priorityKey]++;
          }
        }
      }
    }

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
          total: openedTotal,
        });

        closed.push({
          period: period.label,
          n1: entry.closed.n1,
          n2: entry.closed.n2,
          n3: entry.closed.n3,
          total: closedTotal,
        });

        // Calculate running backlog
        runningBacklog.n1 = Math.max(0, runningBacklog.n1 + entry.opened.n1 - entry.closed.n1);
        runningBacklog.n2 = Math.max(0, runningBacklog.n2 + entry.opened.n2 - entry.closed.n2);
        runningBacklog.n3 = Math.max(0, runningBacklog.n3 + entry.opened.n3 - entry.closed.n3);

        backlog.push({
          period: period.label,
          n1: runningBacklog.n1,
          n2: runningBacklog.n2,
          n3: runningBacklog.n3,
          total: runningBacklog.n1 + runningBacklog.n2 + runningBacklog.n3,
        });
      }
    });

    return { opened, closed, backlog };
  }, [tickets, filter, periodValue]);

  // State to control expanded view
  const [isExpanded, setIsExpanded] = useState(false);

  // Get period config for filtering
  const filterConfig = getFilterConfig(filter);

  // Filter tickets based on chart selection
  const filteredTickets = useMemo(() => {
    if (!tickets || !chartFilter) return tickets || [];
    
    return tickets.filter((ticket) => {
      // Check priority match
      const ticketPriority = ticket.priority?.toLowerCase();
      let priorityMatch = false;
      if (chartFilter.priority === "n1") {
        priorityMatch = ticketPriority === "n1" || ticketPriority === "not_priority";
      } else if (chartFilter.priority === "n2") {
        priorityMatch = ticketPriority === "n2";
      } else if (chartFilter.priority === "n3") {
        priorityMatch = ticketPriority === "n3" || ticketPriority === "priority";
      }
      
      if (!priorityMatch) return false;

      // Check period match based on chart type
      const ticketKey = chartFilter.type === 'closed' && ticket.closed_at 
        ? filterConfig.getKey(new Date(ticket.closed_at))
        : filterConfig.getKey(new Date(ticket.created_at));
      
      const periodLabel = filterConfig.getLabel(
        chartFilter.type === 'closed' && ticket.closed_at 
          ? new Date(ticket.closed_at)
          : new Date(ticket.created_at)
      );
      
      return periodLabel === chartFilter.period;
    });
  }, [tickets, chartFilter, filter]);

  // Get tickets for the list - show 5 or all based on expanded state
  const ticketsToShow = chartFilter ? filteredTickets : (tickets || []);
  const displayedTickets = isExpanded ? ticketsToShow : ticketsToShow.slice(0, 5);
  const totalTickets = ticketsToShow.length;
  const hasMore = totalTickets > 5;

  const handleChartClick = (type: 'opened' | 'closed' | 'backlog') => (period: string, priority: string | null) => {
    if (priority) {
      setChartFilter({ period, priority, type });
      setIsExpanded(false);
    }
  };

  const clearFilter = () => {
    setChartFilter(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Suporte</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
        <FilterButtons value={filter} onChange={onFilterChange} periodValue={periodValue} onPeriodChange={onPeriodChange} />
      </div>

      {/* Metrics Cards with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Chamados Abertos" subtitle="Por nível">
          <SupportBreakdownChart data={chartData.opened} height={220} onBarClick={handleChartClick('opened')} />
        </ChartCard>
        <ChartCard title="Chamados Fechados" subtitle="Por nível">
          <SupportBreakdownChart data={chartData.closed} height={220} onBarClick={handleChartClick('closed')} />
        </ChartCard>
        <ChartCard title="Backlog" subtitle="Por nível">
          <SupportBreakdownChart data={chartData.backlog} height={220} onBarClick={handleChartClick('backlog')} />
        </ChartCard>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {chartFilter ? `Chamados ${chartFilter.type === 'opened' ? 'Abertos' : chartFilter.type === 'closed' ? 'Fechados' : 'Backlog'} - ${chartFilter.period} (${chartFilter.priority.toUpperCase()})` : 'Últimos Chamados'} {totalTickets > 0 && <span className="text-muted-foreground">({totalTickets})</span>}
          </CardTitle>
          {chartFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilter} className="text-xs">
              Limpar filtro
            </Button>
          )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Carregando...</p>
          ) : displayedTickets.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Assunto</TableHead>
                    <TableHead className="text-xs">Remetente</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Prioridade</TableHead>
                    <TableHead className="text-xs">Responsável</TableHead>
                    <TableHead className="text-xs text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => fetchConversation(ticket)}
                    >
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">
                        {ticket.subject || "(Sem assunto)"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.from_name || ticket.from_email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.assignee_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {formatDate(ticket.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {hasMore && (
                <div className="p-3 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Ver menos" : `Ver mais ${totalTickets - 5} chamados`}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum chamado encontrado. Configure os domínios do cliente para vincular tickets automaticamente.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conversation Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] focus:outline-none focus-visible:outline-none focus-visible:ring-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {selectedTicket?.subject || "Conversa"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedTicket?.status || "")}>
                  {getStatusLabel(selectedTicket?.status || "")}
                </Badge>
                <Badge className={getPriorityColor(selectedTicket?.priority)}>
                  {selectedTicket?.priority?.toUpperCase() || "N2"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedTicket?.from_name || selectedTicket?.from_email}
                </span>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando mensagens...</span>
              </div>
            ) : conversationMessages.length > 0 ? (
              <div className="space-y-4">
                {conversationMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex gap-3 ${msg.author_type === "admin" || msg.author_type === "bot" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.author_type === "admin" || msg.author_type === "bot" 
                        ? "bg-primary/20" 
                        : "bg-muted"
                    }`}>
                      {msg.author_type === "admin" || msg.author_type === "bot" ? (
                        <Headphones className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[85%] ${msg.author_type === "admin" || msg.author_type === "bot" ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {msg.author_name || (msg.author_type === "admin" ? "Suporte" : "Cliente")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                      {/* Force light background for email content to ensure readability */}
                      <div 
                        className="text-sm p-4 rounded-lg bg-white text-gray-900 border border-border/50 [&_*]:!text-gray-900 [&_a]:!text-blue-600 [&_img]:max-w-full [&_img]:h-auto"
                        dangerouslySetInnerHTML={{ __html: msg.body || "" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma mensagem encontrada
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
