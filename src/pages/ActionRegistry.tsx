import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Video,
  Mail,
  Phone,
  MessageSquare,
  Search,
  ExternalLink,
  Calendar,
} from "lucide-react";

const actionTypes = [
  { id: "meeting", label: "Reunião", icon: Video },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "call", label: "Ligação", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const customers = [
  { id: "1", name: "Grendene" },
  { id: "2", name: "Ambev" },
  { id: "3", name: "CBMM" },
  { id: "4", name: "Localiza" },
  { id: "5", name: "Natura" },
];

const mockActions = [
  {
    id: 1,
    type: "meeting",
    title: "Revisão Trimestral",
    description: "Discussão sobre expansão do contrato",
    customer: "Grendene",
    date: "2025-12-15",
    link: "https://meet.google.com/abc-123",
  },
  {
    id: 2,
    type: "email",
    title: "Follow-up proposta comercial",
    description: "Envio de proposta atualizada com novos valores",
    customer: "Ambev",
    date: "2025-12-14",
  },
  {
    id: 3,
    type: "call",
    title: "Alinhamento de expectativas",
    description: "Ligação para discutir próximos passos",
    customer: "CBMM",
    date: "2025-12-13",
  },
  {
    id: 4,
    type: "meeting",
    title: "Onboarding Novos Usuários",
    description: "Treinamento realizado com sucesso",
    customer: "Grendene",
    date: "2025-11-20",
    link: "https://meet.google.com/xyz-456",
  },
  {
    id: 5,
    type: "whatsapp",
    title: "Confirmação de reunião",
    description: "Confirmação da data e horário da próxima reunião",
    customer: "Localiza",
    date: "2025-12-12",
  },
  {
    id: 6,
    type: "email",
    title: "Envio de relatório mensal",
    description: "Relatório de performance do mês de novembro",
    customer: "Natura",
    date: "2025-12-10",
  },
];

const getActionIcon = (type: string) => {
  const actionType = actionTypes.find((a) => a.id === type);
  return actionType?.icon || Video;
};

const getActionLabel = (type: string) => {
  const actionType = actionTypes.find((a) => a.id === type);
  return actionType?.label || "Ação";
};

const ActionRegistry = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");

  const filteredActions = mockActions.filter((action) => {
    const matchesSearch =
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || action.type === filterType;
    const matchesCustomer =
      filterCustomer === "all" || action.customer === filterCustomer;
    return matchesSearch && matchesType && matchesCustomer;
  });

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Registro de Ações</h1>
        {/* Header with filters and add button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {actionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.name}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="shrink-0" onClick={() => navigate("/actions/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        </div>

        {/* Counter */}
        <p className="text-sm text-muted-foreground">
          {mockActions.length} ações registradas
        </p>

        {/* Actions list */}
        <div className="glass-card divide-y divide-border">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma ação encontrada
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = getActionIcon(action.type);
              return (
                <div
                  key={action.id}
                  className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/actions/new?edit=${action.id}`)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {action.link && (
                          <a
                            href={action.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary">
                        {getActionLabel(action.type)}
                      </span>
                      <span>{action.customer}</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {action.date}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActionRegistry;
