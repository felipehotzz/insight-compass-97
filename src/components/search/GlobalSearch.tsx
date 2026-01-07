import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Video, Mail, Phone, MessageSquare, FileText, Ticket, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "meeting":
      return Video;
    case "email":
      return Mail;
    case "call":
      return Phone;
    case "whatsapp":
      return MessageSquare;
    default:
      return FileText;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "meeting":
      return "Reunião";
    case "email":
      return "E-mail";
    case "call":
      return "Ligação";
    case "whatsapp":
      return "WhatsApp";
    default:
      return type;
  }
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["search-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, nome_fantasia")
        .eq("status", "ativo")
        .order("nome_fantasia");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch actions
  const { data: actions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["search-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select("id, title, customer, action_type, category, action_date")
        .order("action_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["search-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, from_name, from_email, status, created_at, customer_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const isLoading = customersLoading || actionsLoading || ticketsLoading;

  // Filter based on search
  const searchLower = search.toLowerCase().trim();

  const filteredCustomers = useMemo(() => {
    if (!searchLower) return customers.slice(0, 5);
    return customers.filter((c) =>
      c.nome_fantasia.toLowerCase().includes(searchLower)
    ).slice(0, 5);
  }, [customers, searchLower]);

  const filteredActions = useMemo(() => {
    if (!searchLower) return actions.slice(0, 4);
    return actions.filter((a) =>
      a.title.toLowerCase().includes(searchLower) ||
      a.customer.toLowerCase().includes(searchLower) ||
      (a.category?.toLowerCase().includes(searchLower))
    ).slice(0, 4);
  }, [actions, searchLower]);

  const filteredTickets = useMemo(() => {
    if (!searchLower) return tickets.slice(0, 4);
    return tickets.filter((t) =>
      (t.subject?.toLowerCase().includes(searchLower)) ||
      (t.from_name?.toLowerCase().includes(searchLower)) ||
      (t.from_email?.toLowerCase().includes(searchLower))
    ).slice(0, 4);
  }, [tickets, searchLower]);

  // Check if search matches a customer - if so, show their actions and tickets
  const matchedCustomer = useMemo(() => {
    if (!searchLower) return null;
    return customers.find((c) =>
      c.nome_fantasia.toLowerCase().includes(searchLower)
    );
  }, [customers, searchLower]);

  const customerActions = useMemo(() => {
    if (!matchedCustomer) return [];
    return actions
      .filter((a) => a.customer.toLowerCase() === matchedCustomer.nome_fantasia.toLowerCase())
      .slice(0, 4);
  }, [actions, matchedCustomer]);

  const customerTickets = useMemo(() => {
    if (!matchedCustomer) return [];
    return tickets
      .filter((t) => t.customer_id === matchedCustomer.id)
      .slice(0, 4);
  }, [tickets, matchedCustomer]);

  const handleSelectAction = (actionId: string) => {
    onOpenChange(false);
    setSearch("");
    navigate(`/actions/new?edit=${actionId}`);
  };

  const handleSelectCustomer = (customerId: string) => {
    onOpenChange(false);
    setSearch("");
    navigate(`/raio-x?customer=${customerId}`);
  };

  const handleSelectTicket = (ticketId: string) => {
    onOpenChange(false);
    setSearch("");
    // For now, navigate to tickets page
    navigate(`/tickets/unlinked`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const stripHtml = (html: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Buscar por cliente, ação ou palavra-chave..."
        value={search}
        onValueChange={setSearch}
        className="focus:ring-0 focus:outline-none"
      />
      <CommandList className="max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            {/* Show matched customer first */}
            {matchedCustomer && (
              <>
            <CommandGroup heading="Clientes">
              <CommandItem
                key={matchedCustomer.id}
                onSelect={() => handleSelectCustomer(matchedCustomer.id)}
                className="cursor-pointer"
              >
                <div className="h-6 w-6 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0 mr-2">
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {getInitials(matchedCustomer.nome_fantasia)}
                  </span>
                </div>
                <span>{matchedCustomer.nome_fantasia}</span>
              </CommandItem>
            </CommandGroup>

            {customerActions.length > 0 && (
              <CommandGroup heading={`Ações de ${matchedCustomer.nome_fantasia}`}>
                {customerActions.map((action) => {
                  const Icon = getTypeIcon(action.action_type);
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() => handleSelectAction(action.id)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{action.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTypeLabel(action.action_type)} · {format(new Date(action.action_date), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {customerTickets.length > 0 && (
              <CommandGroup heading={`Tickets de ${matchedCustomer.nome_fantasia}`}>
                {customerTickets.map((ticket) => (
                  <CommandItem
                    key={ticket.id}
                    onSelect={() => handleSelectTicket(ticket.id)}
                    className="cursor-pointer"
                  >
                    <Ticket className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{stripHtml(ticket.subject) || "Sem assunto"}</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.from_name || ticket.from_email} · {format(new Date(ticket.created_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
              </>
            )}

            {/* If no matched customer, show general results */}
            {!matchedCustomer && (
              <>
            {filteredCustomers.length > 0 && (
              <CommandGroup heading="Clientes">
                {filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => handleSelectCustomer(customer.id)}
                    className="cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0 mr-2">
                      <span className="text-[9px] font-medium text-muted-foreground">
                        {getInitials(customer.nome_fantasia)}
                      </span>
                    </div>
                    <span>{customer.nome_fantasia}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredActions.length > 0 && (
              <CommandGroup heading="Ações">
                {filteredActions.map((action) => {
                  const Icon = getTypeIcon(action.action_type);
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() => handleSelectAction(action.id)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{action.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {action.customer} · {getTypeLabel(action.action_type)} · {format(new Date(action.action_date), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {filteredTickets.length > 0 && (
              <CommandGroup heading="Tickets">
                {filteredTickets.map((ticket) => (
                  <CommandItem
                    key={ticket.id}
                    onSelect={() => handleSelectTicket(ticket.id)}
                    className="cursor-pointer"
                  >
                    <Ticket className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{stripHtml(ticket.subject) || "Sem assunto"}</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.from_name || ticket.from_email} · {format(new Date(ticket.created_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              )}
            </>
          )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Hook to use global search with Ctrl+K
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
