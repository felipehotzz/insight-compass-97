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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link2, ExternalLink, RefreshCw, Users } from "lucide-react";
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

interface SuggestionData {
  customerId: string;
  customerName: string;
  domain: string | null;
  relatedTickets: UnlinkedTicket[];
}

export default function UnlinkedTickets() {
  const queryClient = useQueryClient();
  const [selectedCustomers, setSelectedCustomers] = useState<Record<string, string>>({});
  const [suggestionDialog, setSuggestionDialog] = useState<SuggestionData | null>(null);

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

  const extractDomain = (email: string | null) => {
    if (!email) return null;
    const parts = email.split("@");
    return parts.length > 1 ? parts[1].toLowerCase() : null;
  };

  const findRelatedTickets = (linkedTicket: UnlinkedTicket, allTickets: UnlinkedTicket[]) => {
    const email = linkedTicket.from_email?.toLowerCase();
    const domain = extractDomain(linkedTicket.from_email);

    return allTickets.filter((t) => {
      if (t.id === linkedTicket.id) return false;
      
      // Same email match
      if (email && t.from_email?.toLowerCase() === email) return true;
      
      // Same domain match (excluding common domains)
      if (domain && !["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"].includes(domain)) {
        const ticketDomain = extractDomain(t.from_email);
        if (ticketDomain === domain) return true;
      }
      
      return false;
    });
  };

  const linkTicketMutation = useMutation({
    mutationFn: async ({ ticketIds, customerId }: { ticketIds: string[]; customerId: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ customer_id: customerId })
        .in("id", ticketIds);

      if (error) throw error;
      return ticketIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] });
      toast.success(`${count} ticket${count > 1 ? "s" : ""} vinculado${count > 1 ? "s" : ""} com sucesso!`);
      setSuggestionDialog(null);
    },
    onError: () => {
      toast.error("Erro ao vincular tickets");
    },
  });

  const handleLink = (ticket: UnlinkedTicket) => {
    const customerId = selectedCustomers[ticket.id];
    if (!customerId) {
      toast.error("Selecione um cliente primeiro");
      return;
    }

    const customer = customers?.find((c) => c.id === customerId);
    const relatedTickets = tickets ? findRelatedTickets(ticket, tickets) : [];

    if (relatedTickets.length > 0) {
      // Show suggestion dialog
      setSuggestionDialog({
        customerId,
        customerName: customer?.nome_fantasia || "",
        domain: extractDomain(ticket.from_email),
        relatedTickets,
      });
    } else {
      // Link only this ticket
      linkTicketMutation.mutate({ ticketIds: [ticket.id], customerId });
    }
  };

  const handleLinkSingle = () => {
    if (!suggestionDialog) return;
    // Find the original ticket (the one that triggered the suggestion)
    const originalTicketId = Object.entries(selectedCustomers).find(
      ([_, cId]) => cId === suggestionDialog.customerId
    )?.[0];
    
    if (originalTicketId) {
      linkTicketMutation.mutate({ 
        ticketIds: [originalTicketId], 
        customerId: suggestionDialog.customerId 
      });
    }
  };

  const handleLinkAll = () => {
    if (!suggestionDialog) return;
    const originalTicketId = Object.entries(selectedCustomers).find(
      ([_, cId]) => cId === suggestionDialog.customerId
    )?.[0];
    
    if (originalTicketId) {
      const allTicketIds = [originalTicketId, ...suggestionDialog.relatedTickets.map((t) => t.id)];
      linkTicketMutation.mutate({ 
        ticketIds: allTicketIds, 
        customerId: suggestionDialog.customerId 
      });
    }
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

        <div className="rounded-lg bg-card">
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
                          onClick={() => handleLink(ticket)}
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

      {/* Suggestion Dialog */}
      <Dialog open={!!suggestionDialog} onOpenChange={(open) => !open && setSuggestionDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Tickets relacionados encontrados
            </DialogTitle>
            <DialogDescription>
              Encontramos mais {suggestionDialog?.relatedTickets.length} ticket
              {(suggestionDialog?.relatedTickets.length || 0) > 1 ? "s" : ""} do domínio{" "}
              <span className="font-medium text-foreground">@{suggestionDialog?.domain}</span>. 
              Deseja vincular todos a <span className="font-medium text-foreground">{suggestionDialog?.customerName}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto space-y-2 my-4">
            {suggestionDialog?.relatedTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{ticket.from_name || ticket.from_email}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ticket.subject || "Sem assunto"}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(ticket.created_at), "dd/MM/yy")}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleLinkSingle} disabled={linkTicketMutation.isPending}>
              Vincular apenas 1
            </Button>
            <Button onClick={handleLinkAll} disabled={linkTicketMutation.isPending}>
              Vincular todos ({(suggestionDialog?.relatedTickets.length || 0) + 1})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
