import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Video, Mail, Phone, MessageSquare, FileText } from "lucide-react";
import { allCustomers } from "@/data/mockData";

// Mock data - actions registry
const mockActions = [
  {
    id: 1,
    type: "Reunião",
    theme: "Renovação",
    title: "Revisão Trimestral",
    description: "Discussão sobre expansão do contrato",
    customer: "Grendene",
    date: "2025-12-14",
  },
  {
    id: 2,
    type: "Reunião",
    theme: "Onboarding",
    title: "Onboarding Novos Usuários",
    description: "Treinamento realizado com sucesso",
    customer: "Grendene",
    date: "2025-11-19",
  },
  {
    id: 3,
    type: "E-mail",
    theme: "Suporte / Dúvidas",
    title: "Suporte Técnico",
    description: "Resolução de dúvidas técnicas",
    customer: "Ambev",
    date: "2025-11-09",
  },
  {
    id: 4,
    type: "Reunião",
    theme: "Relacionamento",
    title: "Alinhamento Mensal",
    description: "Alinhamento de metas e expectativas",
    customer: "CBMM",
    date: "2025-10-24",
  },
  {
    id: 5,
    type: "E-mail",
    theme: "Expansão",
    title: "Proposta Expansão",
    description: "Envio de proposta de expansão",
    customer: "Localiza",
    date: "2025-10-15",
  },
  {
    id: 6,
    type: "Ligação",
    theme: "Suporte / Dúvidas",
    title: "Follow-up Suporte",
    description: "Acompanhamento de chamado",
    customer: "Natura",
    date: "2025-10-08",
  },
  {
    id: 7,
    type: "WhatsApp",
    theme: "Relacionamento",
    title: "Check-in Rápido",
    description: "Verificação de satisfação",
    customer: "Ambev",
    date: "2025-09-28",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Reunião":
      return Video;
    case "E-mail":
      return Mail;
    case "Ligação":
      return Phone;
    case "WhatsApp":
      return MessageSquare;
    default:
      return FileText;
  }
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Filter actions based on search
  const filteredActions = mockActions.filter((action) => {
    const searchLower = search.toLowerCase();
    return (
      action.title.toLowerCase().includes(searchLower) ||
      action.description.toLowerCase().includes(searchLower) ||
      action.customer.toLowerCase().includes(searchLower) ||
      action.theme.toLowerCase().includes(searchLower) ||
      action.type.toLowerCase().includes(searchLower)
    );
  });

  // Filter customers based on search
  const filteredCustomers = allCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAction = (actionId: number) => {
    onOpenChange(false);
    setSearch("");
    navigate(`/actions?action=${actionId}`);
  };

  const handleSelectCustomer = (customerId: number, customerName: string) => {
    onOpenChange(false);
    setSearch("");
    navigate(`/customer-detail?id=${customerId}&name=${encodeURIComponent(customerName)}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar por cliente, ação ou palavra-chave..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        {filteredCustomers.length > 0 && (
          <CommandGroup heading="Clientes">
            {filteredCustomers.slice(0, 5).map((customer) => (
              <CommandItem
                key={customer.id}
                onSelect={() => handleSelectCustomer(customer.id, customer.name)}
                className="cursor-pointer"
              >
                {/* Avatar with initials or logo */}
                <div className="h-6 w-6 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0 mr-2 overflow-hidden">
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {customer.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span>{customer.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredActions.length > 0 && (
          <CommandGroup heading="Ações">
            {filteredActions.slice(0, 10).map((action) => {
              const Icon = getTypeIcon(action.type);
              return (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelectAction(action.id)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.customer} · {action.theme} · {action.date}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
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
