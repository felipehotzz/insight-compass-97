import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Filter,
  Download
} from "lucide-react";
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
}

interface Contract {
  id: string;
  customer_id: string;
  id_financeiro: string | null;
  id_contrato: string | null;
  status_contrato: string | null;
  tipo_documento: string | null;
  data_movimento: string | null;
  vigencia_inicial: string | null;
  vigencia_final: string | null;
  meses_vigencia: number | null;
  mrr: number | null;
  mrr_atual: boolean;
  tipo_movimento: string | null;
  valor_contrato: number | null;
  vendedor: string | null;
}

interface CustomerWithMetrics extends Customer {
  contracts: Contract[];
  mrr_atual_total: number;
  ltv_total: number;
  total_contratos: number;
  contratos_vigentes: number;
  meses_ativo: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
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

// Calcula meses entre duas datas
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

// Calcula meses de vigência usando meses_vigencia ou calculando pelas datas
const getContractMonths = (contract: Contract): number => {
  if (contract.meses_vigencia && contract.meses_vigencia > 0) {
    return contract.meses_vigencia;
  }
  return calculateMonthsBetween(contract.vigencia_inicial, contract.vigencia_final);
};

export default function CustomersDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ativo" | "inativo">("all");
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Fetch customers with their contracts
  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers-database"],
    queryFn: async () => {
      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("nome_fantasia");

      if (customersError) throw customersError;

      // Fetch all contracts
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("*");

      if (contractsError) throw contractsError;

      // Group contracts by customer and calculate metrics
      const customersWithMetrics: CustomerWithMetrics[] = (customers || []).map((customer) => {
        const customerContracts = (contracts || []).filter(
          (c) => c.customer_id === customer.id
        );

        // MRR Atual: soma apenas dos contratos VIGENTES
        const mrr_atual_total = customerContracts
          .filter((c) => c.status_contrato?.toLowerCase() === "vigente")
          .reduce((sum, c) => sum + (c.mrr || 0), 0);

        // LTV Total: soma de MRR × meses de vigência de TODOS os contratos
        const ltv_total = customerContracts.reduce(
          (sum, c) => sum + (c.mrr || 0) * getContractMonths(c),
          0
        );

        const contratos_vigentes = customerContracts.filter(
          (c) => c.status_contrato?.toLowerCase() === "vigente"
        ).length;

        // Meses Ativo: calcula baseado no período real de atividade
        // Para clientes ativos: desde cohort até hoje
        // Para clientes inativos: desde cohort até o último contrato que terminou
        let meses_ativo = 0;
        if (customer.data_cohort) {
          const startDate = new Date(customer.data_cohort);
          let endDate = new Date(); // default: hoje
          
          // Se cliente inativo, usar a data final do último contrato
          if (customer.status !== "ativo" && customerContracts.length > 0) {
            const lastContractEnd = customerContracts
              .filter((c) => c.vigencia_final)
              .map((c) => new Date(c.vigencia_final!))
              .sort((a, b) => b.getTime() - a.getTime())[0];
            
            if (lastContractEnd) {
              endDate = lastContractEnd;
            }
          }
          
          meses_ativo = Math.floor(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
        }

        return {
          ...customer,
          contracts: customerContracts,
          mrr_atual_total,
          ltv_total,
          total_contratos: customerContracts.length,
          contratos_vigentes,
          meses_ativo: Math.max(0, meses_ativo),
        };
      });

      return customersWithMetrics;
    },
  });

  // Filter customers
  const filteredCustomers = (customersData || []).filter((customer) => {
    const matchesSearch =
      customer.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cnpj.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      customer.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const summaryMetrics = {
    totalClientes: filteredCustomers.length,
    clientesAtivos: filteredCustomers.filter((c) => c.status === "ativo").length,
    mrrTotal: filteredCustomers.reduce((sum, c) => sum + c.mrr_atual_total, 0),
    ltvTotal: filteredCustomers.reduce((sum, c) => sum + c.ltv_total, 0),
  };

  const toggleExpanded = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium">Customers Database</h1>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Clientes</p>
            <p className="text-2xl font-bold">{summaryMetrics.totalClientes}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
            <p className="text-2xl font-bold">{summaryMetrics.clientesAtivos}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">MRR Total</p>
            <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.mrrTotal)}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">LTV Total</p>
            <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.ltvTotal)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, razão social ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "ativo" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ativo")}
              >
                Ativos
              </Button>
              <Button
                variant={statusFilter === "inativo" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inativo")}
              >
                Inativos
              </Button>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">MRR Atual</TableHead>
                <TableHead className="text-right">LTV Total</TableHead>
                <TableHead className="text-center">Contratos</TableHead>
                <TableHead className="text-center">Meses Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <Collapsible
                    key={customer.id}
                    open={expandedCustomers.has(customer.id)}
                    onOpenChange={() => toggleExpanded(customer.id)}
                    asChild
                  >
                    <>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => toggleExpanded(customer.id)}
                      >
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                              {expandedCustomers.has(customer.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{customer.nome_fantasia}</p>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.mrr_atual_total > 0
                            ? formatCurrency(customer.mrr_atual_total)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(customer.ltv_total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{customer.contratos_vigentes}</span>
                          <span className="text-muted-foreground">/{customer.total_contratos}</span>
                        </TableCell>
                        <TableCell className="text-center">{customer.meses_ativo}</TableCell>
                      </TableRow>

                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">
                                  Contratos ({customer.total_contratos})
                                </h4>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/customer/${customer.id}`);
                                  }}
                                >
                                  Ver detalhes completos →
                                </Button>
                              </div>

                              {customer.contracts.length > 0 ? (
                                <div className="border border-border rounded-md overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/30">
                                        <TableHead className="text-xs">ID Financeiro</TableHead>
                                        <TableHead className="text-xs">Tipo</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs">Vigência</TableHead>
                                        <TableHead className="text-xs text-right">MRR</TableHead>
                                        <TableHead className="text-xs text-right">Valor Contrato</TableHead>
                                        <TableHead className="text-xs">Vendedor</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {customer.contracts.slice(0, 5).map((contract) => (
                                        <TableRow key={contract.id} className="text-sm">
                                          <TableCell className="font-mono text-xs">
                                            {contract.id_financeiro || "-"}
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
                                            {formatDate(contract.vigencia_inicial)} - {formatDate(contract.vigencia_final)}
                                          </TableCell>
                                          <TableCell className="text-right text-xs">
                                            {contract.mrr ? formatCurrency(contract.mrr) : "-"}
                                          </TableCell>
                                          <TableCell className="text-right text-xs">
                                            {contract.valor_contrato
                                              ? formatCurrency(contract.valor_contrato)
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            {contract.vendedor || "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  {customer.contracts.length > 5 && (
                                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20">
                                      + {customer.contracts.length - 5} contratos
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Nenhum contrato registrado
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}