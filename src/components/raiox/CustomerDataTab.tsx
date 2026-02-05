import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerDomainsSection } from "./CustomerDomainsSection";
import { Plus, Mail, Phone, Linkedin, Copy, Pencil, Check, X, Trash2 } from "lucide-react";
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

interface Champion {
  id: string;
  customer_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  role: string | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface NewChampionForm {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  role: string;
}

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

const initialChampionForm: NewChampionForm = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  role: "",
};

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

interface CustomerDataTabProps {
  customer: Customer;
  contracts: Contract[];
  champions: Champion[];
  profiles: Profile[];
}

export function CustomerDataTab({ customer, contracts, champions, profiles }: CustomerDataTabProps) {
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
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [isChampionDialogOpen, setIsChampionDialogOpen] = useState(false);
  const [championForm, setChampionForm] = useState<NewChampionForm>(initialChampionForm);
  const [editingChampionId, setEditingChampionId] = useState<string | null>(null);

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const { error } = await supabase
        .from("customers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customer.id);
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
        customer_id: customer.id,
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
      queryClient.invalidateQueries({ queryKey: ["customer-contracts-raiox", customer.id] });
      setIsContractDialogOpen(false);
      setContractForm(initialContractForm);
      setEditingContractId(null);
      toast.success("Contrato criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NewContractForm }) => {
      const { error } = await supabase
        .from("contracts")
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contracts-raiox", customer.id] });
      setIsContractDialogOpen(false);
      setContractForm(initialContractForm);
      setEditingContractId(null);
      toast.success("Contrato atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar contrato: " + error.message);
    },
  });

  // Delete contract mutation
  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contracts-raiox", customer.id] });
      toast.success("Contrato removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover contrato: " + error.message);
    },
  });

  // Create champion mutation
  const createChampionMutation = useMutation({
    mutationFn: async (data: NewChampionForm) => {
      const { error } = await supabase.from("champions").insert({
        customer_id: customer.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        linkedin: data.linkedin || null,
        role: data.role || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-champions", customer.id] });
      setIsChampionDialogOpen(false);
      setChampionForm(initialChampionForm);
      setEditingChampionId(null);
      toast.success("Contato adicionado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao salvar contato: " + error.message);
    },
  });

  // Update champion mutation
  const updateChampionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NewChampionForm }) => {
      const { error } = await supabase
        .from("champions")
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          linkedin: data.linkedin || null,
          role: data.role || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-champions", customer.id] });
      setIsChampionDialogOpen(false);
      setChampionForm(initialChampionForm);
      setEditingChampionId(null);
      toast.success("Contato atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar contato: " + error.message);
    },
  });

  // Delete champion mutation
  const deleteChampionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("champions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-champions", customer.id] });
      toast.success("Contato removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover contato: " + error.message);
    },
  });

  const startEditing = () => {
    setEditForm({
      cnpj: customer.cnpj,
      razao_social: customer.razao_social,
      nome_fantasia: customer.nome_fantasia,
      cs_responsavel: customer.cs_responsavel || "",
      data_cohort: formatDateForInput(customer.data_cohort),
      status: customer.status,
    });
    setIsEditing(true);
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
    if (editingContractId) {
      updateContractMutation.mutate({ id: editingContractId, data: contractForm });
    } else {
      createContractMutation.mutate(contractForm);
    }
  };

  const handleEditContract = (contract: Contract) => {
    setContractForm({
      id_financeiro: contract.id_financeiro || "",
      id_contrato: contract.id_contrato || "",
      tipo_documento: contract.tipo_documento || "",
      status_contrato: contract.status_contrato || "vigente",
      tipo_movimento: contract.tipo_movimento || "",
      data_movimento: formatDateForInput(contract.data_movimento),
      vigencia_inicial: formatDateForInput(contract.vigencia_inicial),
      vigencia_final: formatDateForInput(contract.vigencia_final),
      meses_vigencia: contract.meses_vigencia?.toString() || "",
      mrr: contract.mrr?.toString() || "",
      mrr_atual: contract.mrr_atual ?? true,
      movimento_mrr: contract.movimento_mrr?.toString() || "",
      valor_original_mrr: contract.valor_original_mrr?.toString() || "",
      valor_contrato: contract.valor_contrato?.toString() || "",
      vendedor: contract.vendedor || "",
      condicao_pagamento: contract.condicao_pagamento || "Mensal",
      indice_renovacao: contract.indice_renovacao || "",
      tipo_renovacao: contract.tipo_renovacao || "",
      observacoes: contract.observacoes || "",
    });
    setEditingContractId(contract.id);
    setIsContractDialogOpen(true);
  };

  const handleDeleteContract = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este contrato?")) {
      deleteContractMutation.mutate(id);
    }
  };

  const handleCloseContractDialog = () => {
    setIsContractDialogOpen(false);
    setContractForm(initialContractForm);
    setEditingContractId(null);
  };

  const handleCreateChampion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!championForm.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (editingChampionId) {
      updateChampionMutation.mutate({ id: editingChampionId, data: championForm });
    } else {
      createChampionMutation.mutate(championForm);
    }
  };

  const handleEditChampion = (champion: Champion) => {
    setChampionForm({
      name: champion.name,
      email: champion.email || "",
      phone: champion.phone || "",
      linkedin: champion.linkedin || "",
      role: champion.role || "",
    });
    setEditingChampionId(champion.id);
    setIsChampionDialogOpen(true);
  };

  const handleDeleteChampion = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este contato?")) {
      deleteChampionMutation.mutate(id);
    }
  };

  const handleCloseChampionDialog = () => {
    setIsChampionDialogOpen(false);
    setChampionForm(initialChampionForm);
    setEditingChampionId(null);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("E-mail copiado!");
  };

  return (
    <div className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Domínios de E-mail */}
      <Card>
        <CardContent className="pt-6">
          <CustomerDomainsSection customerId={customer.id} />
        </CardContent>
      </Card>

      {/* Contratos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contratos</CardTitle>
            <Dialog open={isContractDialogOpen} onOpenChange={(open) => {
              if (!open) handleCloseContractDialog();
              else setIsContractDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => {
                  setContractForm(initialContractForm);
                  setEditingContractId(null);
                }}>
                  <Plus className="h-4 w-4" />
                  Novo Contrato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingContractId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateContract} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm">ID Financeiro</Label>
                      <Input
                        value={contractForm.id_financeiro}
                        onChange={(e) => setContractForm({ ...contractForm, id_financeiro: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">ID Contrato</Label>
                      <Input
                        value={contractForm.id_contrato}
                        onChange={(e) => setContractForm({ ...contractForm, id_contrato: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Tipo de Documento</Label>
                      <Input
                        value={contractForm.tipo_documento}
                        onChange={(e) => setContractForm({ ...contractForm, tipo_documento: e.target.value })}
                        placeholder="Ex: Contrato, Aditivo..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Status</Label>
                      <Select
                        value={contractForm.status_contrato}
                        onValueChange={(value) => setContractForm({ ...contractForm, status_contrato: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vigente">Vigente</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Vigência Inicial</Label>
                      <Input
                        type="date"
                        value={contractForm.vigencia_inicial}
                        onChange={(e) => setContractForm({ ...contractForm, vigencia_inicial: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Vigência Final</Label>
                      <Input
                        type="date"
                        value={contractForm.vigencia_final}
                        onChange={(e) => setContractForm({ ...contractForm, vigencia_final: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">MRR</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={contractForm.mrr}
                        onChange={(e) => setContractForm({ ...contractForm, mrr: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Valor do Contrato</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={contractForm.valor_contrato}
                        onChange={(e) => setContractForm({ ...contractForm, valor_contrato: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseContractDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createContractMutation.isPending || updateContractMutation.isPending}>
                      {(createContractMutation.isPending || updateContractMutation.isPending) ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">ID Financeiro</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Movimento</TableHead>
                    <TableHead className="text-xs">Início</TableHead>
                    <TableHead className="text-xs">Fim</TableHead>
                    <TableHead className="text-xs text-right">MRR</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs w-[80px]"></TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditContract(contract)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar contrato</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteContract(contract.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remover contrato</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum contrato encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Champions (Contatos) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Champions (Contatos)</CardTitle>
            <Dialog open={isChampionDialogOpen} onOpenChange={(open) => {
              if (!open) handleCloseChampionDialog();
              else setIsChampionDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => {
                  setChampionForm(initialChampionForm);
                  setEditingChampionId(null);
                }}>
                  <Plus className="h-4 w-4" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingChampionId ? "Editar Contato" : "Novo Contato"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateChampion} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Nome *</Label>
                      <Input
                        value={championForm.name}
                        onChange={(e) => setChampionForm({ ...championForm, name: e.target.value })}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Cargo</Label>
                      <Input
                        value={championForm.role}
                        onChange={(e) => setChampionForm({ ...championForm, role: e.target.value })}
                        placeholder="Ex: Diretor de Marketing"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">E-mail</Label>
                      <Input
                        type="email"
                        value={championForm.email}
                        onChange={(e) => setChampionForm({ ...championForm, email: e.target.value })}
                        placeholder="email@empresa.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Telefone</Label>
                      <Input
                        value={championForm.phone}
                        onChange={(e) => setChampionForm({ ...championForm, phone: e.target.value })}
                        placeholder="+55 11 99999-0000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">LinkedIn</Label>
                      <Input
                        value={championForm.linkedin}
                        onChange={(e) => setChampionForm({ ...championForm, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseChampionDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createChampionMutation.isPending || updateChampionMutation.isPending}>
                      {(createChampionMutation.isPending || updateChampionMutation.isPending) ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {champions && champions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Cargo</TableHead>
                    <TableHead className="text-xs">E-mail</TableHead>
                    <TableHead className="text-xs">Telefone</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {champions.map((champion) => (
                    <TableRow key={champion.id}>
                      <TableCell className="text-sm font-medium">{champion.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{champion.role || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{champion.email || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{champion.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {champion.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleCopyEmail(champion.email!)}
                                  >
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="flex items-center gap-2">
                                  <span>Copiar e-mail</span>
                                  <Copy className="h-3 w-3" />
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {champion.phone && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {champion.linkedin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={champion.linkedin} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditChampion(champion)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteChampion(champion.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato cadastrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
