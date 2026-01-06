import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Building2, FileText, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const CustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

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

  const isLoading = isLoadingCustomer || isLoadingContracts;

  // Calculate metrics
  const metrics = {
    // MRR Atual: soma apenas dos contratos VIGENTES
    mrrAtual: (contracts || [])
      .filter((c) => c.status_contrato?.toLowerCase() === "vigente")
      .reduce((sum, c) => sum + (c.mrr || 0), 0),
    // LTV Total: soma de MRR × meses de vigência de TODOS os contratos
    ltvTotal: (contracts || []).reduce(
      (sum, c) => sum + (c.mrr || 0) * (c.meses_vigencia || 1),
      0
    ),
    totalContratos: contracts?.length || 0,
    contratosVigentes: (contracts || []).filter(
      (c) => c.status_contrato?.toLowerCase() === "vigente"
    ).length,
    mesesAtivo: customer?.data_cohort
      ? Math.max(
          0,
          Math.floor(
            (new Date().getTime() - new Date(customer.data_cohort).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        )
      : 0,
    valorTotalContratos: (contracts || []).reduce(
      (sum, c) => sum + (c.valor_contrato || 0),
      0
    ),
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
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dados Cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Métricas
            </CardTitle>
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
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contratos ({contracts?.length || 0})
            </CardTitle>
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
