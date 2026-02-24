import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Search, 
  Filter,
  Download,
  Globe,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  status: string;
  data_cohort: string | null;
  cs_responsavel: string | null;
  plano: string | null;
  fase: string | null;
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
  condicao_pagamento: string | null;
}

interface CustomerWithMetrics extends Customer {
  contracts: Contract[];
  mrr_atual_total: number;
  ltv_total: number;
  total_contratos: number;
  contratos_vigentes: number;
  meses_ativo: number;
  formato_pagamento: string | null;
  domain: string | null;
  fase: string | null;
  ongoingYear: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
  const [enrichingDomains, setEnrichingDomains] = useState(false);
  const [cleaningDomains, setCleaningDomains] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

      // Fetch all customer domains
      const { data: domains, error: domainsError } = await supabase
        .from("customer_domains")
        .select("customer_id, domain");

      if (domainsError) throw domainsError;

      // Create domain map
      const domainMap = new Map<string, string>();
      (domains || []).forEach((d) => {
        domainMap.set(d.customer_id, d.domain);
      });

      // Group contracts by customer and calculate metrics
      const now = new Date();
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

        // Formato de pagamento: pegar do contrato vigente principal (maior MRR)
        const contratoVigentePrincipal = customerContracts
          .filter((c) => c.status_contrato?.toLowerCase() === "vigente")
          .sort((a, b) => (b.mrr || 0) - (a.mrr || 0))[0];
        
        const formato_pagamento = contratoVigentePrincipal?.condicao_pagamento || null;

        // Calculate effective phase (same logic as Raio-X)
        const activeContracts = customerContracts.filter(
          (c) => c.status_contrato?.toLowerCase() === "vigente"
        );
        const latestActiveContract = [...activeContracts]
          .sort((a, b) => new Date(b.vigencia_inicial || 0).getTime() - new Date(a.vigencia_inicial || 0).getTime())[0];
        
        const diasRestantes = latestActiveContract?.vigencia_final
          ? Math.max(0, Math.floor((new Date(latestActiveContract.vigencia_final).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        
        let effectiveFase = customer.fase || 'onboarding';
        if (diasRestantes > 0 && diasRestantes <= 90 && effectiveFase !== 'recuperacao' && effectiveFase !== 'expansao') {
          effectiveFase = 'renovacao';
        }

        // Calculate ongoing year
        let ongoingYear = 0;
        if (effectiveFase === 'ongoing' && customer.data_cohort) {
          const cohortDate = new Date(customer.data_cohort);
          const yearsActive = Math.floor((now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
          ongoingYear = Math.max(1, yearsActive + 1);
        }

        return {
          ...customer,
          contracts: customerContracts,
          mrr_atual_total,
          ltv_total,
          total_contratos: customerContracts.length,
          contratos_vigentes,
          meses_ativo: Math.max(0, meses_ativo),
          formato_pagamento,
          domain: domainMap.get(customer.id) || null,
          fase: effectiveFase,
          ongoingYear,
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

  const handleOpenRaioX = (customerId: string) => {
    navigate(`/raio-x?customer=${customerId}`);
  };

  const handleCleanupDomains = async () => {
    setCleaningDomains(true);
    toast.info("Limpando formato dos domínios...", { duration: 3000 });

    try {
      const { data, error } = await supabase.functions.invoke("enrich-customer-domains", {
        body: { mode: "cleanup" },
      });

      if (error) throw error;

      if (data?.success && data?.results) {
        const { updated, total } = data.results;
        toast.success(`Domínios corrigidos: ${updated} de ${total}`, {
          description: "Removidos https://, www. e caminhos",
        });
        queryClient.invalidateQueries({ queryKey: ["customers-database"] });
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Error cleaning domains:", error);
      toast.error("Erro ao limpar domínios", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setCleaningDomains(false);
    }
  };

  const handleEnrichDomains = async () => {
    setEnrichingDomains(true);
    toast.info("Buscando domínios automaticamente...", { duration: 5000 });

    try {
      const { data, error } = await supabase.functions.invoke("enrich-customer-domains", {
        body: { mode: "batch" },
      });

      if (error) throw error;

      if (data?.success && data?.results) {
        const { success, failed, total } = data.results;
        toast.success(`Domínios atualizados: ${success} de ${total} clientes`, {
          description: failed > 0 ? `${failed} não encontrados` : undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["customers-database"] });
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Error enriching domains:", error);
      toast.error("Erro ao buscar domínios", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setEnrichingDomains(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium">Customers Database</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleCleanupDomains}
              disabled={cleaningDomains || enrichingDomains}
            >
              {cleaningDomains ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {cleaningDomains ? "Limpando..." : "Limpar Domínios"}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleEnrichDomains}
              disabled={enrichingDomains || cleaningDomains}
            >
              {enrichingDomains ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {enrichingDomains ? "Buscando..." : "Buscar Domínios"}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Clientes</p>
            <p className="text-2xl">{summaryMetrics.totalClientes}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
            <p className="text-2xl">{summaryMetrics.clientesAtivos}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">MRR Total</p>
            <p className="text-2xl">{formatCurrency(summaryMetrics.mrrTotal)}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">LTV Total</p>
            <p className="text-2xl">{formatCurrency(summaryMetrics.ltvTotal)}</p>
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
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">LTV Total</TableHead>
                <TableHead className="text-center">Contratos</TableHead>
                <TableHead className="text-center">Meses Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleOpenRaioX(customer.id)}
                  >
                    <TableCell>
                      <p className="font-medium">{customer.nome_fantasia}</p>
                    </TableCell>
                    <TableCell>
                      {customer.plano || "-"}
                     </TableCell>
                    <TableCell>
                      {customer.fase ? (
                        <span className={`text-sm font-medium ${
                          customer.fase === 'onboarding' ? 'text-blue-400' :
                          customer.fase === 'ongoing' ? 'text-green-400' :
                          customer.fase === 'renovacao' ? 'text-yellow-400' :
                          customer.fase === 'recuperacao' ? 'text-red-400' :
                          customer.fase === 'expansao' ? 'text-purple-400' :
                          'text-muted-foreground'
                        }`}>
                          {customer.fase === 'onboarding' ? 'Onboarding' :
                           customer.fase === 'ongoing' ? `Ongoing ${customer.ongoingYear}` :
                           customer.fase === 'renovacao' ? 'Renovação' :
                           customer.fase === 'recuperacao' ? 'Recuperação' :
                           customer.fase === 'expansao' ? 'Expansão' :
                           customer.fase}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.domain ? (
                        <a 
                          href={`https://${customer.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {customer.domain}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                    <TableCell>
                      {customer.formato_pagamento || "-"}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}