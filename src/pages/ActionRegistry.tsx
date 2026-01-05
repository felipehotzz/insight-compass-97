import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    date: "2025-10-14",
  },
  {
    id: 6,
    type: "Ligação",
    theme: "Suporte / Dúvidas",
    title: "Follow-up Suporte",
    description: "Acompanhamento de chamado",
    customer: "Natura",
    date: "2025-10-10",
  },
];

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
        <h1 className="text-xl text-foreground">Ações</h1>
        
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
                  <SelectItem key={type.id} value={type.label}>
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
          {filteredActions.length} ações registradas
        </p>

        {/* Actions list - same style as CustomerDetail */}
        <div className="glass-card p-5">
          <div className="space-y-0">
            <div className="grid grid-cols-5 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
              <span>Ação</span>
              <span>Cliente</span>
              <span>Tipo</span>
              <span>Tema</span>
              <span className="text-right">Data</span>
            </div>
            <div className="divide-y divide-border">
              {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma ação encontrada
                </div>
              ) : (
                filteredActions.map((action) => (
                  <div 
                    key={action.id} 
                    className="grid grid-cols-5 gap-4 px-2 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => navigate(`/actions/new?edit=${action.id}`)}
                  >
                    <span className="text-sm font-medium truncate">{action.title}</span>
                    <span className="text-sm text-muted-foreground truncate">{action.customer}</span>
                    <Badge variant="outline" className="w-fit text-xs">{action.type}</Badge>
                    <Badge variant="secondary" className="w-fit text-xs">{action.theme}</Badge>
                    <span className="text-sm text-muted-foreground text-right">
                      {new Date(action.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActionRegistry;
