import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Check, X } from "lucide-react";
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

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

const formatDateForInput = (dateStr: string | null) => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const calculateMonthsBetween = (startDate: string | null, endDate: string | null): number => {
  if (!startDate || !endDate) return 1;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, months);
  } catch {
    return 1;
  }
};

const getContractMonths = (contract: Contract): number => {
  if (contract.meses_vigencia && contract.meses_vigencia > 0) {
    return contract.meses_vigencia;
  }
  return calculateMonthsBetween(contract.vigencia_inicial, contract.vigencia_final);
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

const CustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();

      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!customerId,
  });

  // Fetch contracts
  const { data: contracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["customer-contracts", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("customer_id", customerId)
        .order("data_movimento", { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!customerId,
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const { error } = await supabase
        .from("customers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers-database"] });
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
        customer_id: customerId,
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
      queryClient.invalidateQueries({ queryKey: ["customer-contracts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers-database"] });
      setIsContractDialogOpen(false);
      setContractForm(initialContractForm);
      toast.success("Contrato criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });

  const isLoading = isLoadingCustomer || isLoadingContracts;

  // Calculate metrics
  const metrics = {
    mrrAtual: (contracts || [])
      .filter((c) => c.status_contrato?.toLowerCase() === "vigente")
      .reduce((sum, c) => sum + (c.mrr || 0), 0),
    ltvTotal: (contracts || []).reduce(
      (sum, c) => sum + (c.mrr || 0) * getContractMonths(c),
      0
    ),
    totalContratos: contracts?.length || 0,
    contratosVigentes: (contracts || []).filter(
      (c) => c.status_contrato?.toLowerCase() === "vigente"
    ).length,
    mesesAtivo: (() => {
      if (!customer?.data_cohort) return 0;
      const startDate = new Date(customer.data_cohort);
      let endDate = new Date();
      
      if (customer.status !== "ativo" && contracts && contracts.length > 0) {
        const lastContractEnd = contracts
          .filter((c) => c.vigencia_final)
          .map((c) => new Date(c.vigencia_final!))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        
        if (lastContractEnd) {
          endDate = lastContractEnd;
        }
      }
      
      return Math.max(0, Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
    })(),
    valorTotalContratos: (contracts || []).reduce(
      (sum, c) => sum + (c.valor_contrato || 0),
      0
    ),
  };

  const startEditing = () => {
    if (customer) {
      setEditForm({
        cnpj: customer.cnpj,
        razao_social: customer.razao_social,
        nome_fantasia: customer.nome_fantasia,
        cs_responsavel: customer.cs_responsavel || "",
        data_cohort: formatDateForInput(customer.data_cohort),
        status: customer.status,
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/cdb")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-center py-12 text-muted-foreground">
            Cliente não encontrado
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/cdb")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-medium">{customer.nome_fantasia}</h1>
              <p className="text-sm text-muted-foreground">{customer.razao_social}</p>
            </div>
            <Badge
              variant={customer.status === "ativo" ? "default" : "secondary"}
              className={
                customer.status === "ativo"
                  ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                  : ""
              }
            >
              {customer.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <Button onClick={() => navigate(`/actions/new?customer=${encodeURIComponent(customer.nome_fantasia)}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Ação
          </Button>
        </div>

        {/* Dados Cadastrais */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Dados Cadastrais</CardTitle>
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
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="font-mono text-sm">{customer.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Razão Social</p>
                  <p className="text-sm">{customer.razao_social}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                  <p className="text-sm">{customer.nome_fantasia}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CS Responsável</p>
                  <p className="text-sm">{customer.cs_responsavel || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Cohort</p>
                  <p className="text-sm">{formatDate(customer.data_cohort)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm capitalize">{customer.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="text-sm">{formatDate(customer.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Atualizado em</p>
                  <p className="text-sm">{formatDate(customer.updated_at)}</p>
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
                  <Input
                    value={editForm.cs_responsavel}
                    onChange={(e) => setEditForm({ ...editForm, cs_responsavel: e.target.value })}
                    className="h-8 text-sm"
                  />
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
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Criado em</Label>
                  <p className="text-sm h-8 flex items-center">{formatDate(customer.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Atualizado em</Label>
                  <p className="text-sm h-8 flex items-center">{formatDate(customer.updated_at)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">MRR Atual</p>
                <p className="text-lg font-bold">{formatCurrency(metrics.mrrAtual)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">LTV Total</p>
                <p className="text-lg font-bold">{formatCurrency(metrics.ltvTotal)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Valor Total Contratos</p>
                <p className="text-lg font-bold">{formatCurrency(metrics.valorTotalContratos)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Contratos Vigentes</p>
                <p className="text-lg font-bold">{metrics.contratosVigentes}/{metrics.totalContratos}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Meses Ativo</p>
                <p className="text-lg font-bold">{metrics.mesesAtivo}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Contratos</p>
                <p className="text-lg font-bold">{metrics.totalContratos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contratos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contratos ({contracts?.length || 0})</CardTitle>
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
                        <Label className="text-xs">MRR Atual</Label>
                        <Select
                          value={contractForm.mrr_atual ? "sim" : "nao"}
                          onValueChange={(value) => setContractForm({ ...contractForm, mrr_atual: value === "sim" })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sim">Sim</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Movimento MRR</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={contractForm.movimento_mrr}
                          onChange={(e) => setContractForm({ ...contractForm, movimento_mrr: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Original MRR</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={contractForm.valor_original_mrr}
                          onChange={(e) => setContractForm({ ...contractForm, valor_original_mrr: e.target.value })}
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
                      <div className="space-y-1">
                        <Label className="text-xs">Condição Pagamento</Label>
                        <Select
                          value={contractForm.condicao_pagamento}
                          onValueChange={(value) => setContractForm({ ...contractForm, condicao_pagamento: value })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Anual">Anual</SelectItem>
                            <SelectItem value="À vista">À vista</SelectItem>
                            <SelectItem value="Única">Única</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Índice Renovação</Label>
                        <Input
                          value={contractForm.indice_renovacao}
                          onChange={(e) => setContractForm({ ...contractForm, indice_renovacao: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Ex: IGPM, IPCA"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo Renovação</Label>
                        <Input
                          value={contractForm.tipo_renovacao}
                          onChange={(e) => setContractForm({ ...contractForm, tipo_renovacao: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Ex: Automática"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Observações</Label>
                      <Textarea
                        value={contractForm.observacoes}
                        onChange={(e) => setContractForm({ ...contractForm, observacoes: e.target.value })}
                        className="text-sm"
                        rows={3}
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
          </CardHeader>
          <CardContent className="p-0">
            {contracts && contracts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">ID Financeiro</TableHead>
                      <TableHead className="text-xs">ID Contrato</TableHead>
                      <TableHead className="text-xs">Tipo Doc.</TableHead>
                      <TableHead className="text-xs">Status Contrato</TableHead>
                      <TableHead className="text-xs">Tipo Movimento</TableHead>
                      <TableHead className="text-xs">Data Movimento</TableHead>
                      <TableHead className="text-xs">Vigência Inicial</TableHead>
                      <TableHead className="text-xs">Vigência Final</TableHead>
                      <TableHead className="text-xs text-center">Meses Vig.</TableHead>
                      <TableHead className="text-xs text-right">MRR</TableHead>
                      <TableHead className="text-xs text-center">MRR Atual</TableHead>
                      <TableHead className="text-xs text-right">Mov. MRR</TableHead>
                      <TableHead className="text-xs text-right">Valor Original MRR</TableHead>
                      <TableHead className="text-xs text-right">Valor Contrato</TableHead>
                      <TableHead className="text-xs">Vendedor</TableHead>
                      <TableHead className="text-xs">Cond. Pagamento</TableHead>
                      <TableHead className="text-xs">Índice Renovação</TableHead>
                      <TableHead className="text-xs">Tipo Renovação</TableHead>
                      <TableHead className="text-xs">Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} className="text-sm">
                        <TableCell className="font-mono text-xs">
                          {contract.id_financeiro || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {contract.id_contrato || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {contract.tipo_documento || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              contract.status_contrato?.toLowerCase() === "vigente"
                                ? "border-green-500/50 text-green-500"
                                : "border-muted-foreground/50"
                            }
                          >
                            {contract.status_contrato || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {contract.tipo_movimento || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(contract.data_movimento)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(contract.vigencia_inicial)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(contract.vigencia_final)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {contract.meses_vigencia ?? "-"}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {formatCurrency(contract.mrr)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={contract.mrr_atual ? "default" : "secondary"}
                            className={contract.mrr_atual ? "bg-blue-500/20 text-blue-500" : ""}
                          >
                            {contract.mrr_atual ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatCurrency(contract.movimento_mrr)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatCurrency(contract.valor_original_mrr)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {formatCurrency(contract.valor_contrato)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {contract.vendedor || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {contract.condicao_pagamento || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {contract.indice_renovacao || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {contract.tipo_renovacao || "-"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={contract.observacoes || ""}>
                          {contract.observacoes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contrato encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetail;
