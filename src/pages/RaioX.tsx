import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterButtons } from "@/components/dashboard/FilterButtons";
import { ActionBreakdownChart, generateActionsData } from "@/components/charts/ActionBreakdownChart";
import { ActionThemeChart, generateActionsThemeData } from "@/components/charts/ActionThemeChart";
import { ChannelBreakdownChart, generateChannelData, generateDispatchData } from "@/components/charts/ChannelBreakdownChart";
import { SupportBreakdownChart, generateOpenedTicketsData, generateClosedTicketsData, generateBacklogData } from "@/components/charts/SupportBreakdownChart";
import { SimpleLineChart, generateUsersData, generateCollaboratorsData } from "@/components/charts/SimpleLineChart";
import type { TimeFilter } from "@/components/dashboard/FilterButtons";
import { Plus, ChevronDown, ChevronRight, Mail, Phone, Linkedin, Copy, ArrowRight, Pencil, Check, X } from "lucide-react";
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
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: string;
  customer_id: string;
  id_financeiro: string | null;
  id_contrato: string | null;
  status_contrato: string | null;
  status_cliente: string | null;
  tipo_documento: string | null;
  tipo_movimento: string | null;
  tipo_renovacao: string | null;
  data_movimento: string | null;
  vigencia_inicial: string | null;
  vigencia_final: string | null;
  meses_vigencia: number | null;
  mrr: number | null;
  mrr_atual: boolean | null;
  movimento_mrr: number | null;
  valor_original_mrr: number | null;
  valor_contrato: number | null;
  vendedor: string | null;
  condicao_pagamento: string | null;
  indice_renovacao: string | null;
  observacoes: string | null;
  created_at: string;
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
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrencyShort = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateForInput = (dateStr: string | null) => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const getContractMonths = (contract: Contract): number => {
  if (contract.meses_vigencia && contract.meses_vigencia > 0) {
    return contract.meses_vigencia;
  }
  return calculateMonthsBetween(contract.vigencia_inicial, contract.vigencia_final) || 1;
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

const calculateMonthsRemaining = (endDate: string | null): number => {
  if (!endDate) return 0;
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
};

interface NewContractForm {
  id_financeiro: string;
  id_contrato: string;
  tipo_documento: string;
  status_contrato: string;
  tipo_movimento: string;
  data_movimento: string;
  vigencia_inicial: string;
  vigencia_final: string;
  meses_vigencia: string;
  mrr: string;
  mrr_atual: boolean;
  movimento_mrr: string;
  valor_original_mrr: string;
  valor_contrato: string;
  vendedor: string;
  condicao_pagamento: string;
  indice_renovacao: string;
  tipo_renovacao: string;
  observacoes: string;
}

const initialContractForm: NewContractForm = {
  id_financeiro: "",
  id_contrato: "",
  tipo_documento: "",
  status_contrato: "vigente",
  tipo_movimento: "",
  data_movimento: "",
  vigencia_inicial: "",
  vigencia_final: "",
  meses_vigencia: "",
  mrr: "",
  mrr_atual: true,
  movimento_mrr: "",
  valor_original_mrr: "",
  valor_contrato: "",
  vendedor: "",
  condicao_pagamento: "Mensal",
  indice_renovacao: "",
  tipo_renovacao: "",
  observacoes: "",
};

const RaioX = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const customerIdFromUrl = searchParams.get("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customerIdFromUrl);
  const [relacionamentoFilter, setRelacionamentoFilter] = useState<TimeFilter>("month");
  const [utilizacaoFilter, setUtilizacaoFilter] = useState<TimeFilter>("month");
  const [suporteFilter, setSuporteFilter] = useState<TimeFilter>("month");
  
  // Customer data section state
  const [dadosClienteOpen, setDadosClienteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    cnpj: "",
    razao_social: "",
    nome_fantasia: "",
    cs_responsavel: "",
    data_cohort: "",
    status: "",
  });
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contractForm, setContractForm] = useState<NewContractForm>(initialContractForm);

  // Sync URL param with state
  useEffect(() => {
    if (customerIdFromUrl && customerIdFromUrl !== selectedCustomerId) {
      setSelectedCustomerId(customerIdFromUrl);
    }
  }, [customerIdFromUrl]);

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

  // Fetch profiles (users) for CS Responsável dropdown
  const { data: profiles } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("name");
      if (error) throw error;
      return data;
    },
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
      return { 
        mrrAtual: 0, 
        ltvRealizado: 0,
        ltvARealizar: 0,
        valorTotalContratos: 0,
        contratosVigentes: 0,
        totalContratos: 0,
        mesesAtivo: 0, 
        planoAtual: "-", 
        mesesRestantes: 0,
        valorContrato: 0
      };
    }

    const now = new Date();
    const activeContracts = contracts.filter(c => c.status_contrato?.toLowerCase() === "vigente");
    const mrrAtual = activeContracts.reduce((sum, c) => sum + (c.mrr || 0), 0);
    const valorContrato = activeContracts.reduce((sum, c) => sum + (c.valor_contrato || 0), 0);
    
    // Calculate LTV Realizado (what already happened)
    let ltvRealizado = 0;
    // Calculate LTV A Realizar (what's still to come)
    let ltvARealizar = 0;
    
    contracts.forEach(c => {
      const mrr = c.mrr || 0;
      const startDate = c.vigencia_inicial ? new Date(c.vigencia_inicial) : null;
      const endDate = c.vigencia_final ? new Date(c.vigencia_final) : null;
      
      if (!startDate) return;
      
      if (c.status_contrato?.toLowerCase() === "vencido" || (endDate && endDate < now)) {
        // Entire contract is in the past - all is realized
        const months = getContractMonths(c);
        ltvRealizado += mrr * months;
      } else if (startDate <= now) {
        // Contract has started - part realized, part to realize
        const monthsElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const monthsRemaining = endDate 
          ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
          : 0;
        
        ltvRealizado += mrr * monthsElapsed;
        ltvARealizar += mrr * monthsRemaining;
      } else {
        // Contract hasn't started yet - all is to realize
        const months = getContractMonths(c);
        ltvARealizar += mrr * months;
      }
    });
    
    const valorTotalContratos = contracts.reduce((sum, c) => sum + (c.valor_contrato || 0), 0);
    const mesesAtivo = calculateMonthsBetween(selectedCustomer.data_cohort, null);
    
    // Get current plan from latest active contract
    const latestContract = activeContracts
      .sort((a, b) => new Date(b.vigencia_inicial || 0).getTime() - new Date(a.vigencia_inicial || 0).getTime())[0];
    
    // Get plan from tipo_documento field
    const planoAtual = latestContract?.tipo_documento || "-";
    
    // Calculate remaining months from today to contract end
    const mesesRestantes = latestContract?.vigencia_final
      ? calculateMonthsRemaining(latestContract.vigencia_final)
      : 0;

    return { 
      mrrAtual,
      ltvRealizado,
      ltvARealizar,
      valorTotalContratos,
      contratosVigentes: activeContracts.length,
      totalContratos: contracts.length,
      mesesAtivo, 
      planoAtual, 
      mesesRestantes,
      valorContrato
    };
  }, [contracts, selectedCustomer]);

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const { error } = await supabase
        .from("customers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCustomer?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-raiox"] });
      setIsEditing(false);
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (data: NewContractForm) => {
      const { error } = await supabase.from("contracts").insert({
        customer_id: selectedCustomer?.id,
        id_financeiro: data.id_financeiro || null,
        id_contrato: data.id_contrato || null,
        tipo_documento: data.tipo_documento || null,
        status_contrato: data.status_contrato || null,
        tipo_movimento: data.tipo_movimento || null,
        data_movimento: data.data_movimento || null,
        vigencia_inicial: data.vigencia_inicial || null,
        vigencia_final: data.vigencia_final || null,
        meses_vigencia: data.meses_vigencia ? parseInt(data.meses_vigencia) : null,
        mrr: data.mrr ? parseFloat(data.mrr) : null,
        mrr_atual: data.mrr_atual,
        movimento_mrr: data.movimento_mrr ? parseFloat(data.movimento_mrr) : null,
        valor_original_mrr: data.valor_original_mrr ? parseFloat(data.valor_original_mrr) : null,
        valor_contrato: data.valor_contrato ? parseFloat(data.valor_contrato) : null,
        vendedor: data.vendedor || null,
        condicao_pagamento: data.condicao_pagamento || null,
        indice_renovacao: data.indice_renovacao || null,
        tipo_renovacao: data.tipo_renovacao || null,
        observacoes: data.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contracts-raiox", selectedCustomer?.id] });
      setIsContractDialogOpen(false);
      setContractForm(initialContractForm);
      toast.success("Contrato criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });

  const startEditing = () => {
    if (selectedCustomer) {
      setEditForm({
        cnpj: selectedCustomer.cnpj,
        razao_social: selectedCustomer.razao_social,
        nome_fantasia: selectedCustomer.nome_fantasia,
        cs_responsavel: selectedCustomer.cs_responsavel || "",
        data_cohort: formatDateForInput(selectedCustomer.data_cohort),
        status: selectedCustomer.status,
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = () => {
    updateCustomerMutation.mutate({
      cnpj: editForm.cnpj,
      razao_social: editForm.razao_social,
      nome_fantasia: editForm.nome_fantasia,
      cs_responsavel: editForm.cs_responsavel || null,
      data_cohort: editForm.data_cohort || null,
      status: editForm.status,
    });
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    createContractMutation.mutate(contractForm);
  };

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
              <p className="text-xs text-muted-foreground uppercase tracking-wide">MRR Atual</p>
              <p className="text-2xl font-medium mt-1">{formatCurrencyShort(metrics.mrrAtual)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">LTV Realizado</p>
              <p className="text-2xl font-medium mt-1">{formatCurrencyShort(metrics.ltvRealizado)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">LTV A Realizar</p>
              <p className="text-2xl font-medium mt-1">{formatCurrencyShort(metrics.ltvARealizar)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tempo Ativo</p>
              <p className="text-2xl font-medium mt-1">{metrics.mesesAtivo} meses</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Plano Atual</p>
              <p className="text-2xl font-medium mt-1">{metrics.planoAtual}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Meses Restantes</p>
              <p className="text-2xl font-medium mt-1">{metrics.mesesRestantes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Dados do Cliente - Collapsible Section */}
        <Collapsible open={dadosClienteOpen} onOpenChange={setDadosClienteOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {dadosClienteOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Dados do Cliente
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {contracts?.length || 0} contratos
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {/* Dados Cadastrais */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Dados Cadastrais</h3>
                    {!isEditing ? (
                      <Button variant="ghost" size="sm" onClick={startEditing} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={cancelEditing}
                          disabled={updateCustomerMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={saveChanges}
                          disabled={updateCustomerMutation.isPending}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">CNPJ</p>
                        <p className="font-mono text-sm">{selectedCustomer.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Razão Social</p>
                        <p className="text-sm">{selectedCustomer.razao_social}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                        <p className="text-sm">{selectedCustomer.nome_fantasia}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CS Responsável</p>
                        <p className="text-sm">{selectedCustomer.cs_responsavel || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data Cohort</p>
                        <p className="text-sm">{formatDate(selectedCustomer.data_cohort)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm capitalize">{selectedCustomer.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Criado em</p>
                        <p className="text-sm">{formatDate(selectedCustomer.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Atualizado em</p>
                        <p className="text-sm">{formatDate(selectedCustomer.updated_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">CNPJ</Label>
                        <Input
                          value={editForm.cnpj}
                          onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Razão Social</Label>
                        <Input
                          value={editForm.razao_social}
                          onChange={(e) => setEditForm({ ...editForm, razao_social: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                        <Input
                          value={editForm.nome_fantasia}
                          onChange={(e) => setEditForm({ ...editForm, nome_fantasia: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">CS Responsável</Label>
                        <Select
                          value={editForm.cs_responsavel}
                          onValueChange={(value) => setEditForm({ ...editForm, cs_responsavel: value })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecione um responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles?.map((profile) => (
                              <SelectItem key={profile.id} value={profile.name}>
                                {profile.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Data Cohort</Label>
                        <Input
                          type="date"
                          value={editForm.data_cohort}
                          onChange={(e) => setEditForm({ ...editForm, data_cohort: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>


                {/* Contratos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Contratos ({contracts?.length || 0})</h3>
                    <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Novo Contrato
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Novo Contrato</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateContract} className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">ID Financeiro</Label>
                              <Input
                                value={contractForm.id_financeiro}
                                onChange={(e) => setContractForm({ ...contractForm, id_financeiro: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">ID Contrato</Label>
                              <Input
                                value={contractForm.id_contrato}
                                onChange={(e) => setContractForm({ ...contractForm, id_contrato: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tipo Documento</Label>
                              <Input
                                value={contractForm.tipo_documento}
                                onChange={(e) => setContractForm({ ...contractForm, tipo_documento: e.target.value })}
                                className="h-8 text-sm"
                                placeholder="Ex: Contrato"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Status Contrato</Label>
                              <Select
                                value={contractForm.status_contrato}
                                onValueChange={(value) => setContractForm({ ...contractForm, status_contrato: value })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="vigente">Vigente</SelectItem>
                                  <SelectItem value="encerrado">Encerrado</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tipo Movimento</Label>
                              <Input
                                value={contractForm.tipo_movimento}
                                onChange={(e) => setContractForm({ ...contractForm, tipo_movimento: e.target.value })}
                                className="h-8 text-sm"
                                placeholder="Ex: new, expansion"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Data Movimento</Label>
                              <Input
                                type="date"
                                value={contractForm.data_movimento}
                                onChange={(e) => setContractForm({ ...contractForm, data_movimento: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Vigência Inicial</Label>
                              <Input
                                type="date"
                                value={contractForm.vigencia_inicial}
                                onChange={(e) => setContractForm({ ...contractForm, vigencia_inicial: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Vigência Final</Label>
                              <Input
                                type="date"
                                value={contractForm.vigencia_final}
                                onChange={(e) => setContractForm({ ...contractForm, vigencia_final: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Meses Vigência</Label>
                              <Input
                                type="number"
                                value={contractForm.meses_vigencia}
                                onChange={(e) => setContractForm({ ...contractForm, meses_vigencia: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">MRR</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={contractForm.mrr}
                                onChange={(e) => setContractForm({ ...contractForm, mrr: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Valor Contrato</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={contractForm.valor_contrato}
                                onChange={(e) => setContractForm({ ...contractForm, valor_contrato: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Vendedor</Label>
                              <Input
                                value={contractForm.vendedor}
                                onChange={(e) => setContractForm({ ...contractForm, vendedor: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Observações</Label>
                            <Textarea
                              value={contractForm.observacoes}
                              onChange={(e) => setContractForm({ ...contractForm, observacoes: e.target.value })}
                              className="text-sm"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsContractDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={createContractMutation.isPending}>
                              {createContractMutation.isPending ? "Salvando..." : "Criar Contrato"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {contracts && contracts.length > 0 ? (
                    <div className="overflow-x-auto border border-border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">ID Financeiro</TableHead>
                            <TableHead className="text-xs">Tipo Doc.</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Tipo Movimento</TableHead>
                            <TableHead className="text-xs">Vigência Inicial</TableHead>
                            <TableHead className="text-xs">Vigência Final</TableHead>
                            <TableHead className="text-xs text-right">MRR</TableHead>
                            <TableHead className="text-xs text-right">Valor Contrato</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contracts.map((contract) => (
                            <TableRow key={contract.id}>
                              <TableCell className="text-sm font-mono">{contract.id_financeiro || "-"}</TableCell>
                              <TableCell className="text-sm">{contract.tipo_documento || "-"}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={contract.status_contrato?.toLowerCase() === "vigente" ? "default" : "secondary"}
                                  className={contract.status_contrato?.toLowerCase() === "vigente" 
                                    ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" 
                                    : ""}
                                >
                                  {contract.status_contrato || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{contract.tipo_movimento || "-"}</TableCell>
                              <TableCell className="text-sm">{formatDate(contract.vigencia_inicial)}</TableCell>
                              <TableCell className="text-sm">{formatDate(contract.vigencia_final)}</TableCell>
                              <TableCell className="text-sm text-right">{formatCurrency(contract.mrr)}</TableCell>
                              <TableCell className="text-sm text-right">{formatCurrency(contract.valor_contrato)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum contrato encontrado</p>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
