import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface UnlinkedTicket {
  id: string;
  intercom_conversation_id: string;
  from_email: string | null;
  from_name: string | null;
  subject: string | null;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  nome_fantasia: string;
}

export default function UnlinkedTickets() {
  const queryClient = useQueryClient();
  const [selectedCustomers, setSelectedCustomers] = useState<Record<string, string>>({});

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["unlinked-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, intercom_conversation_id, from_email, from_name, subject, status, created_at")
        .is("customer_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UnlinkedTicket[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, nome_fantasia")
        .eq("status", "ativo")
        .order("nome_fantasia");

      if (error) throw error;
      return data as Customer[];
    },
  });

  const linkTicketMutation = useMutation({
    mutationFn: async ({ ticketId, customerId }: { ticketId: string; customerId: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ customer_id: customerId })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] });
      toast.success("Ticket vinculado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao vincular ticket");
    },
  });

  const handleLink = (ticketId: string) => {
    const customerId = selectedCustomers[ticketId];
    if (!customerId) {
      toast.error("Selecione um cliente primeiro");
      return;
    }
    linkTicketMutation.mutate({ ticketId, customerId });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      open: { variant: "default", label: "Aberto" },
      closed: { variant: "secondary", label: "Fechado" },
      snoozed: { variant: "outline", label: "Adiado" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const extractDomain = (email: string | null) => {
    if (!email) return null;
    const parts = email.split("@");
    return parts.length > 1 ? parts[1] : null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tickets Não Vinculados</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tickets?.length || 0} tickets sem cliente associado
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Email / Nome</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead className="w-[250px]">Vincular a</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : tickets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Todos os tickets estão vinculados a clientes!
                  </TableCell>
                </TableRow>
              ) : (
                tickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{ticket.from_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{ticket.from_email || "Sem email"}</p>
                        {ticket.from_email && (
                          <p className="text-xs text-primary">@{extractDomain(ticket.from_email)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2">{ticket.subject || "Sem assunto"}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedCustomers[ticket.id] || ""}
                        onValueChange={(value) =>
                          setSelectedCustomers((prev) => ({ ...prev, [ticket.id]: value }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.nome_fantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLink(ticket.id)}
                          disabled={!selectedCustomers[ticket.id] || linkTicketMutation.isPending}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://app.intercom.com/a/inbox/gzgj8crd/inbox/conversation/${ticket.intercom_conversation_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
