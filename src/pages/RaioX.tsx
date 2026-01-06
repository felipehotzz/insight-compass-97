import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FilterButtons } from "@/components/dashboard/FilterButtons";
import { ActionBreakdownChart, generateActionsData } from "@/components/charts/ActionBreakdownChart";
import { ActionThemeChart, generateActionsThemeData } from "@/components/charts/ActionThemeChart";
import { ChannelBreakdownChart, generateChannelData, generateDispatchData } from "@/components/charts/ChannelBreakdownChart";
import { SupportBreakdownChart, generateOpenedTicketsData, generateClosedTicketsData, generateBacklogData } from "@/components/charts/SupportBreakdownChart";
import { SimpleLineChart, generateUsersData, generateCollaboratorsData } from "@/components/charts/SimpleLineChart";
import type { TimeFilter } from "@/components/dashboard/FilterButtons";
import { Plus, ChevronDown, Mail, Phone, Linkedin, Copy, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Customer {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  status: string;
  data_cohort: string | null;
  cs_responsavel: string | null;
}

interface Contract {
  id: string;
  customer_id: string;
  mrr: number | null;
  valor_contrato: number | null;
  vigencia_inicial: string | null;
  vigencia_final: string | null;
  meses_vigencia: number | null;
  status_contrato: string | null;
}

interface Action {
  id: string;
  title: string;
  customer: string;
  action_type: string;
  category: string | null;
  action_date: string;
}

// Mock data for champions/contacts
const mockChampions = [
  { name: "Maria Silva", email: "maria.silva@empresa.com", phone: "+55 11 99999-0001", linkedin: "https://linkedin.com/in/mariasilva" },
  { name: "João Souza", email: "joao.souza@empresa.com", phone: "+55 11 99999-0002", linkedin: "https://linkedin.com/in/joaosouza" },
];

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
};

const calculateMonthsBetween = (startDate: string | null, endDate: string | null): number => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
};

const RaioX = () => {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [relacionamentoFilter, setRelacionamentoFilter] = useState<TimeFilter>("month");
  const [utilizacaoFilter, setUtilizacaoFilter] = useState<TimeFilter>("month");
  const [suporteFilter, setSuporteFilter] = useState<TimeFilter>("month");

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["customers-raiox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("nome_fantasia");
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Auto-select first customer if none selected
  const selectedCustomer = useMemo(() => {
    if (!customers || customers.length === 0) return null;
    if (selectedCustomerId) {
      return customers.find(c => c.id === selectedCustomerId) || customers[0];
    }
    return customers[0];
  }, [customers, selectedCustomerId]);

  // Fetch contracts for selected customer
  const { data: contracts } = useQuery({
    queryKey: ["customer-contracts-raiox", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("customer_id", selectedCustomer.id);
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!selectedCustomer,
  });

  // Fetch actions for selected customer
  const { data: actions } = useQuery({
    queryKey: ["customer-actions-raiox", selectedCustomer?.nome_fantasia],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("customer", selectedCustomer.nome_fantasia)
        .order("action_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Action[];
    },
    enabled: !!selectedCustomer,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!contracts || !selectedCustomer) {
      return { valorContrato: 0, ltvTotal: 0, mesesAtivo: 0, planoAtual: "-", mesesRestantes: 0 };
    }

    const activeContracts = contracts.filter(c => c.status_contrato?.toLowerCase() === "vigente");
    const valorContrato = activeContracts.reduce((sum, c) => sum + (c.valor_contrato || 0), 0);
    const ltvTotal = contracts.reduce((sum, c) => {
      const months = c.meses_vigencia || calculateMonthsBetween(c.vigencia_inicial, c.vigencia_final) || 1;
      return sum + (c.mrr || 0) * months;
    }, 0);
    const mesesAtivo = calculateMonthsBetween(selectedCustomer.data_cohort, null);
    
    // Get current plan from latest contract
    const latestContract = contracts
      .filter(c => c.status_contrato?.toLowerCase() === "vigente")
      .sort((a, b) => new Date(b.vigencia_inicial || 0).getTime() - new Date(a.vigencia_inicial || 0).getTime())[0];
    
    const planoAtual = latestContract ? "Enterprise" : "-"; // Mock plan name
    
    // Calculate remaining months
    const mesesRestantes = latestContract?.vigencia_final
      ? Math.max(0, calculateMonthsBetween(null, latestContract.vigencia_final))
      : 0;

    return { valorContrato, ltvTotal, mesesAtivo, planoAtual, mesesRestantes };
  }, [contracts, selectedCustomer]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("E-mail copiado!");
  };

  if (!selectedCustomer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with customer selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
              {getInitials(selectedCustomer.nome_fantasia)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-xl font-medium gap-2 px-2 hover:bg-transparent">
                  {selectedCustomer.nome_fantasia}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto bg-popover">
                {customers?.map((customer) => (
                  <DropdownMenuItem
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={customer.id === selectedCustomer.id ? "bg-muted" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-medium">
                        {getInitials(customer.nome_fantasia)}
                      </div>
                      <span>{customer.nome_fantasia}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button onClick={() => navigate(`/actions/new?customer=${encodeURIComponent(selectedCustomer.nome_fantasia)}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Ação
          </Button>
        </div>

        {/* Metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">R$ Contrato</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.valorContrato)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">LTV Total (R$)</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.ltvTotal)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tempo Ativo</p>
              <p className="text-2xl font-bold mt-1">{metrics.mesesAtivo} meses</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Plano Atual</p>
              <p className="text-2xl font-bold mt-1">{metrics.planoAtual}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Meses Restantes</p>
              <p className="text-2xl font-bold mt-1">{metrics.mesesRestantes}</p>
            </CardContent>
          </Card>
        </div>

        {/* CS Responsável and Champions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">CS Responsável</p>
              <div className="flex items-center justify-between">
                <p className="font-medium">{selectedCustomer.cs_responsavel || "Não definido"}</p>
                {selectedCustomer.cs_responsavel && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{selectedCustomer.cs_responsavel?.toLowerCase().replace(" ", ".")}@empresa.com</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">Champions (Contatos)</p>
              <div className="space-y-3">
                {mockChampions.map((champion, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{champion.name}</span>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopyEmail(champion.email)}
                            >
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="flex items-center gap-2">
                            <span>{champion.email}</span>
                            <Copy className="h-3 w-3" />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={champion.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relacionamento section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Relacionamento</h2>
            <FilterButtons
              value={relacionamentoFilter}
              onChange={setRelacionamentoFilter}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Ações por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionBreakdownChart data={generateActionsData(relacionamentoFilter)} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Ações por tema</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionThemeChart data={generateActionsThemeData(relacionamentoFilter)} height={280} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registro de Ações */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Registro de Ações</p>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(`/actions?customer=${encodeURIComponent(selectedCustomer.nome_fantasia)}`)}
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-transparent hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-normal">Ação</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-normal">Cliente</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-normal">Tipo</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-normal">Tema</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-normal text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions && actions.length > 0 ? (
                  actions.map((action) => (
                    <TableRow key={action.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{action.title}</TableCell>
                      <TableCell className="text-muted-foreground">{action.customer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {action.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {action.category || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(action.action_date)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma ação registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Utilização section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Utilização</h2>
            <FilterButtons
              value={utilizacaoFilter}
              onChange={setUtilizacaoFilter}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Comunicados Enviados</CardTitle>
                <p className="text-xs text-muted-foreground">Por canal</p>
              </CardHeader>
              <CardContent>
                <ChannelBreakdownChart data={generateChannelData(utilizacaoFilter)} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Disparos Totais</CardTitle>
                <p className="text-xs text-muted-foreground">Por canal</p>
              </CardHeader>
              <CardContent>
                <ChannelBreakdownChart data={generateDispatchData(utilizacaoFilter)} height={280} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Suporte section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Suporte</h2>
            <FilterButtons
              value={suporteFilter}
              onChange={setSuporteFilter}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Chamados Abertos</CardTitle>
                <p className="text-xs text-muted-foreground">Por nível</p>
              </CardHeader>
              <CardContent>
                <SupportBreakdownChart data={generateOpenedTicketsData(suporteFilter)} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Chamados Fechados</CardTitle>
                <p className="text-xs text-muted-foreground">Por nível</p>
              </CardHeader>
              <CardContent>
                <SupportBreakdownChart data={generateClosedTicketsData(suporteFilter)} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Backlog</CardTitle>
                <p className="text-xs text-muted-foreground">Por nível</p>
              </CardHeader>
              <CardContent>
                <SupportBreakdownChart data={generateBacklogData(suporteFilter)} height={280} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Usuários section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Usuários na Base</CardTitle>
              <p className="text-xs text-muted-foreground">Evolução ao longo do tempo</p>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={generateUsersData("month")} height={200} color="hsl(var(--color-growth))" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Colaboradores Cadastrados</CardTitle>
              <p className="text-xs text-muted-foreground">Evolução ao longo do tempo</p>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={generateCollaboratorsData("month")} height={200} color="hsl(var(--color-growth))" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RaioX;
