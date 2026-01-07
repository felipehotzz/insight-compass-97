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
import { CustomerDropdownCompact } from "@/components/actions/CustomerDropdownCompact";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, RefreshCw, Users, Eye, Loader2, Check, ChevronDown, ChevronRight, Archive, Building2, ArchiveX, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { IntercomThreadView } from "@/components/email/IntercomThreadView";

interface UnlinkedTicket {
  id: string;
  intercom_conversation_id: string;
  from_email: string | null;
  from_name: string | null;
  subject: string | null;
  status: string;
  created_at: string;
  archived: boolean | null;
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
  originalTicketId: string;
}

interface ConversationMessage {
  id: string;
  author_type: string;
  author_name: string | null;
  body: string | null;
  created_at: string;
}

interface ConversationDetail {
  id: string;
  title: string | null;
  state: string;
  messages: ConversationMessage[];
}

export default function UnlinkedTickets() {
  const queryClient = useQueryClient();
  const [suggestionDialog, setSuggestionDialog] = useState<SuggestionData | null>(null);
  const [viewingTicket, setViewingTicket] = useState<UnlinkedTicket | null>(null);
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [linkingTicketId, setLinkingTicketId] = useState<string | null>(null);
  const [linkedTicketIds, setLinkedTicketIds] = useState<Set<string>>(new Set());
  const [noEmailCollapsed, setNoEmailCollapsed] = useState(true);
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [archivedCollapsed, setArchivedCollapsed] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  // Query para buscar o último sync da tabela sync_history
  const { data: lastSyncDate } = useQuery({
    queryKey: ["last-sync-date"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_history")
        .select("completed_at, total_synced, status")
        .eq("sync_type", "intercom_tickets")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    },
  });

  // Mutation para sincronizar tickets do Intercom
  const syncTicketsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-intercom-tickets");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const synced = data?.synced || 0;
      const processed = data?.totalProcessed || 0;
      toast.success(`Sync concluído! ${synced} novos tickets de ${processed} verificados.`);
      queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["last-sync-date"] });
    },
    onError: (error) => {
      console.error("Sync error:", error);
      toast.error("Erro ao sincronizar tickets");
    },
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["unlinked-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, intercom_conversation_id, from_email, from_name, subject, status, created_at, archived")
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
      if (linkedTicketIds.has(t.id)) return false;
      
      if (email && t.from_email?.toLowerCase() === email) return true;
      
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
      return ticketIds;
    },
    onSuccess: (ticketIds) => {
      // Add to linked set for animation
      setLinkedTicketIds((prev) => new Set([...prev, ...ticketIds]));
      
      const count = ticketIds.length;
      toast.success(`${count} ticket${count > 1 ? "s" : ""} vinculado${count > 1 ? "s" : ""} com sucesso!`, {
        icon: <Check className="h-4 w-4 text-green-500" />,
      });
      
      setSuggestionDialog(null);
      setLinkingTicketId(null);
      
      // Refresh list after animation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] });
        setLinkedTicketIds(new Set());
      }, 500);
    },
    onError: () => {
      toast.error("Erro ao vincular tickets");
      setLinkingTicketId(null);
    },
  });

  const handleSelectCustomer = (ticket: UnlinkedTicket, customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    const relatedTickets = tickets ? findRelatedTickets(ticket, tickets) : [];

    setLinkingTicketId(ticket.id);

    if (relatedTickets.length > 0) {
      // Show suggestion dialog
      setSuggestionDialog({
        customerId,
        customerName: customer?.nome_fantasia || "",
        domain: extractDomain(ticket.from_email),
        relatedTickets,
        originalTicketId: ticket.id,
      });
    } else {
      // Link immediately
      linkTicketMutation.mutate({ ticketIds: [ticket.id], customerId });
    }
  };

  const handleLinkSingle = () => {
    if (!suggestionDialog) return;
    linkTicketMutation.mutate({ 
      ticketIds: [suggestionDialog.originalTicketId], 
      customerId: suggestionDialog.customerId 
    });
  };

  const handleLinkAll = () => {
    if (!suggestionDialog) return;
    const allTicketIds = [suggestionDialog.originalTicketId, ...suggestionDialog.relatedTickets.map((t) => t.id)];
    linkTicketMutation.mutate({ 
      ticketIds: allTicketIds, 
      customerId: suggestionDialog.customerId 
    });
  };

  const archiveTicketMutation = useMutation({
    mutationFn: async ({ ticketId, archived }: { ticketId: string; archived: boolean }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ archived })
        .eq("id", ticketId);

      if (error) throw error;
      return ticketId;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.archived ? "Ticket arquivado!" : "Ticket desarquivado!");
      queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] });
    },
    onError: () => {
      toast.error("Erro ao arquivar ticket");
    },
  });

  const archiveBatchMutation = useMutation({
    mutationFn: async (ticketIds: string[]) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ archived: true })
        .in("id", ticketIds);

      if (error) throw error;
      return ticketIds;
    },
    onSuccess: (ticketIds) => {
      toast.success(`${ticketIds.length} ticket${ticketIds.length > 1 ? "s" : ""} arquivado${ticketIds.length > 1 ? "s" : ""}!`);
      setSelectedTickets(new Set());
      queryClient.invalidateQueries({ queryKey: ["unlinked-tickets"] });
    },
    onError: () => {
      toast.error("Erro ao arquivar tickets");
    },
  });

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(ticketId);
      } else {
        newSet.delete(ticketId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && ticketsWithEmail) {
      setSelectedTickets(new Set(ticketsWithEmail.map((t) => t.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleViewTicket = async (ticket: UnlinkedTicket) => {
    setViewingTicket(ticket);
    setConversationDetail(null);
    setLoadingConversation(true);

    try {
      const { data, error } = await supabase.functions.invoke("get-intercom-conversation", {
        body: { conversationId: ticket.intercom_conversation_id },
      });

      if (error) throw error;
      if (data?.conversation) {
        setConversationDetail(data.conversation);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Erro ao carregar detalhes da conversa");
    } finally {
      setLoadingConversation(false);
    }
  };

  const getStatusIndicator = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-amber-500",
      closed: "bg-green-500",
      snoozed: "bg-blue-500",
    };
    return (
      <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-muted"}`} title={status === "open" ? "Aberto" : status === "closed" ? "Fechado" : "Adiado"} />
    );
  };

  const stripHtml = (html: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  // Separate tickets: with email (excluding internal and archived), internal (@comunica.in), without email, and archived
  const isInternalEmail = (email: string | null) => email?.toLowerCase().endsWith("@comunica.in");
  
  const ticketsWithEmail = tickets?.filter((t) => !linkedTicketIds.has(t.id) && t.from_email && !isInternalEmail(t.from_email) && !t.archived);
  const internalTickets = tickets?.filter((t) => !linkedTicketIds.has(t.id) && isInternalEmail(t.from_email) && !t.archived);
  const ticketsWithoutEmail = tickets?.filter((t) => !linkedTicketIds.has(t.id) && !t.from_email && !t.archived);
  const archivedTickets = tickets?.filter((t) => !linkedTicketIds.has(t.id) && t.archived);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Tickets Não Vinculados</h1>
            <p className="text-sm text-muted-foreground">
              {ticketsWithEmail?.length || 0} tickets sem cliente associado
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSyncDate?.completed_at && (
              <span className="text-xs text-muted-foreground">
                Último sync: {format(new Date(lastSyncDate.completed_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            )}
            {selectedTickets.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => archiveBatchMutation.mutate(Array.from(selectedTickets))}
                disabled={archiveBatchMutation.isPending}
              >
                {archiveBatchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArchiveX className="h-4 w-4 mr-2" />
                )}
                Arquivar {selectedTickets.size} ticket{selectedTickets.size > 1 ? "s" : ""}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncTicketsMutation.mutate()}
              disabled={syncTicketsMutation.isPending}
            >
              {syncTicketsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={ticketsWithEmail?.length ? selectedTickets.size === ticketsWithEmail.length : false}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead className="w-[200px]">De</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead className="w-[140px]">Data</TableHead>
                <TableHead className="w-[200px]">Vincular a</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
              ) : ticketsWithEmail?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Todos os tickets com email estão vinculados a clientes!
                  </TableCell>
                </TableRow>
              ) : (
                ticketsWithEmail?.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className={`transition-all duration-300 cursor-pointer ${
                      linkedTicketIds.has(ticket.id) 
                        ? "opacity-0 bg-green-500/10 scale-95" 
                        : "opacity-100 hover:bg-muted/50"
                    }`}
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTickets.has(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="w-[30px]">
                      {getStatusIndicator(ticket.status)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[180px]">
                        {ticket.from_name || ticket.from_email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-1">{stripHtml(ticket.subject) || "Sem assunto"}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(ticket.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <CustomerDropdownCompact
                        customers={customers || []}
                        onValueChange={(customerId) => handleSelectCustomer(ticket, customerId)}
                        isLoading={linkingTicketId === ticket.id}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver conversa
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://app.intercom.com/a/inbox/gzgj8crd/inbox/conversation/${ticket.intercom_conversation_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir no Intercom
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => archiveTicketMutation.mutate({ ticketId: ticket.id, archived: true })}
                            disabled={archiveTicketMutation.isPending}
                          >
                            <ArchiveX className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Tickets sem email - Seção colapsada */}
        {ticketsWithoutEmail && ticketsWithoutEmail.length > 0 && (
          <Collapsible open={!noEmailCollapsed} onOpenChange={(open) => setNoEmailCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Tickets sem email ({ticketsWithoutEmail.length})
                  </span>
                  <Badge variant="outline" className="text-xs">Produto descontinuado</Badge>
                </div>
                {noEmailCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg bg-card mt-2 border border-muted">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="w-[200px]">Nome</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[140px]">Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsWithoutEmail.map((ticket) => (
                      <TableRow key={ticket.id} className="opacity-75">
                        <TableCell>
                          <p className="text-sm line-clamp-2">{stripHtml(ticket.subject) || "Sem assunto"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{ticket.from_name || "—"}</p>
                        </TableCell>
                        <TableCell>{getStatusIndicator(ticket.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver conversa
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://app.intercom.com/a/inbox/gzgj8crd/inbox/conversation/${ticket.intercom_conversation_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Abrir no Intercom
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tickets internos @comunica.in - Seção colapsada */}
        {internalTickets && internalTickets.length > 0 && (
          <Collapsible open={!internalCollapsed} onOpenChange={(open) => setInternalCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Tickets internos @comunica.in ({internalTickets.length})
                  </span>
                  <Badge variant="outline" className="text-xs">Equipe interna</Badge>
                </div>
                {internalCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg bg-card mt-2 border border-muted">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="w-[200px]">Email / Nome</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[140px]">Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internalTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="opacity-75">
                        <TableCell>
                          <p className="text-sm line-clamp-2">{stripHtml(ticket.subject) || "Sem assunto"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{ticket.from_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{ticket.from_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusIndicator(ticket.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver conversa
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://app.intercom.com/a/inbox/gzgj8crd/inbox/conversation/${ticket.intercom_conversation_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Abrir no Intercom
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tickets arquivados - Seção colapsada */}
        {archivedTickets && archivedTickets.length > 0 && (
          <Collapsible open={!archivedCollapsed} onOpenChange={(open) => setArchivedCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted">
                <div className="flex items-center gap-2">
                  <ArchiveX className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Tickets arquivados ({archivedTickets.length})
                  </span>
                  <Badge variant="outline" className="text-xs">Irrelevantes</Badge>
                </div>
                {archivedCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-lg bg-card mt-2 border border-muted">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="w-[200px]">Email / Nome</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[140px]">Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="opacity-75">
                        <TableCell>
                          <p className="text-sm line-clamp-2">{stripHtml(ticket.subject) || "Sem assunto"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{ticket.from_name || "—"}</p>
                            {ticket.from_email && (
                              <p className="text-xs text-muted-foreground">{ticket.from_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusIndicator(ticket.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver conversa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => archiveTicketMutation.mutate({ ticketId: ticket.id, archived: false })}
                                disabled={archiveTicketMutation.isPending}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Desarquivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={!!viewingTicket} onOpenChange={(open) => !open && setViewingTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] [&>button]:hidden focus:outline-none focus-visible:outline-none focus-visible:ring-0">
          {/* Header matching list design */}
          <div className="flex items-center gap-4 pb-4 border-b border-border mb-4">
            {/* Status indicator */}
            {viewingTicket && getStatusIndicator(viewingTicket.status)}
            
            {/* Sender */}
            <div className="w-[200px] flex-shrink-0">
              <p className="text-sm font-medium truncate">
                {viewingTicket?.from_name || viewingTicket?.from_email}
              </p>
            </div>
            
            {/* Subject */}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{stripHtml(viewingTicket?.subject) || "Sem assunto"}</p>
            </div>
            
            {/* Date */}
            <div className="flex-shrink-0 text-sm text-muted-foreground whitespace-nowrap">
              {viewingTicket && format(new Date(viewingTicket.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
            </div>
            
            {/* Intercom link */}
            <a
              href={`https://app.intercom.com/a/inbox/gzgj8crd/inbox/conversation/${viewingTicket?.intercom_conversation_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Intercom
            </a>
          </div>

          <ScrollArea className="h-[65vh] pr-4">
            <IntercomThreadView 
              messages={conversationDetail?.messages || []} 
              loading={loadingConversation}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Suggestion Dialog */}
      <Dialog 
        open={!!suggestionDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setSuggestionDialog(null);
            setLinkingTicketId(null);
          }
        }}
      >
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
                  <p className="text-xs text-muted-foreground line-clamp-1">{stripHtml(ticket.subject) || "Sem assunto"}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(ticket.created_at), "dd/MM/yy")}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleLinkSingle} disabled={linkTicketMutation.isPending}>
              {linkTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Vincular apenas 1
            </Button>
            <Button onClick={handleLinkAll} disabled={linkTicketMutation.isPending}>
              {linkTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Vincular todos ({(suggestionDialog?.relatedTickets.length || 0) + 1})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
