import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterButtons } from "@/components/dashboard/FilterButtons";
import type { TimeFilter } from "@/components/dashboard/FilterButtons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, subWeeks, subMonths, subQuarters } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
interface SupportTicketsSectionProps {
  customerId: string;
  filter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

interface Ticket {
  id: string;
  from_email: string | null;
  from_name: string | null;
  subject: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  closed_at: string | null;
  assignee_name: string | null;
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
  switch (priority) {
    case "n1":
      return "bg-red-500/20 text-red-500";
    case "n2":
      return "bg-orange-500/20 text-orange-500";
    case "n3":
      return "bg-blue-500/20 text-blue-500";
    default:
      return "";
  }
};

export const SupportTicketsSection = ({ customerId, filter, onFilterChange }: SupportTicketsSectionProps) => {
  const queryClient = useQueryClient();
  const startDate = getDateRange(filter);

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

  // Fetch tickets for this customer
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets", customerId, filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("customer_id", customerId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });
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

  // Calculate chart data from real tickets
  const chartData = useMemo(() => {
    if (!tickets) return { opened: [], closed: [], backlog: [] };

    // Group tickets by period
    const openedByPriority: SupportData = { period: "Período", n1: 0, n2: 0, n3: 0, total: 0 };
    const closedByPriority: SupportData = { period: "Período", n1: 0, n2: 0, n3: 0, total: 0 };

    for (const ticket of tickets) {
      const priority = ticket.priority || "n2";
      const priorityKey = priority as "n1" | "n2" | "n3";

      openedByPriority[priorityKey]++;
      openedByPriority.total++;

      if (ticket.status === "closed") {
        closedByPriority[priorityKey]++;
        closedByPriority.total++;
      }
    }

    // Backlog
    const backlogByPriority: SupportData = { period: "Atual", n1: 0, n2: 0, n3: 0, total: 0 };
    for (const ticket of backlogTickets || []) {
      const priority = ticket.priority || "n2";
      const priorityKey = priority as "n1" | "n2" | "n3";
      backlogByPriority[priorityKey]++;
      backlogByPriority.total++;
    }

    return {
      opened: [openedByPriority],
      closed: [closedByPriority],
      backlog: [backlogByPriority],
    };
  }, [tickets, backlogTickets]);

  // Get latest 5 tickets for the list
  const latestTickets = tickets?.slice(0, 5) || [];

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
        <FilterButtons value={filter} onChange={onFilterChange} />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Chamados Abertos</CardTitle>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chartData.opened[0]?.total || 0}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-red-500">N1: {chartData.opened[0]?.n1 || 0}</span>
              <span className="text-orange-500">N2: {chartData.opened[0]?.n2 || 0}</span>
              <span className="text-blue-500">N3: {chartData.opened[0]?.n3 || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Chamados Fechados</CardTitle>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chartData.closed[0]?.total || 0}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-red-500">N1: {chartData.closed[0]?.n1 || 0}</span>
              <span className="text-orange-500">N2: {chartData.closed[0]?.n2 || 0}</span>
              <span className="text-blue-500">N3: {chartData.closed[0]?.n3 || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Backlog</CardTitle>
            <p className="text-xs text-muted-foreground">Em aberto</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chartData.backlog[0]?.total || 0}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-red-500">N1: {chartData.backlog[0]?.n1 || 0}</span>
              <span className="text-orange-500">N2: {chartData.backlog[0]?.n2 || 0}</span>
              <span className="text-blue-500">N3: {chartData.backlog[0]?.n3 || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Últimos Chamados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Carregando...</p>
          ) : latestTickets.length > 0 ? (
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
                {latestTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
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
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority?.toUpperCase() || "N2"}
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
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum chamado encontrado. Configure os domínios do cliente para vincular tickets automaticamente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
