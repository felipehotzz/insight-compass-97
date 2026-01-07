import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
import { CustomerDataTab } from "@/components/raiox/CustomerDataTab";
import { RelationshipTab } from "@/components/raiox/RelationshipTab";
import { UsageTab } from "@/components/raiox/UsageTab";
import { SupportTicketsSection } from "@/components/raiox/SupportTicketsSection";
import { Plus, ChevronDown, User, Share2, BarChart3, Ticket } from "lucide-react";

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

interface Champion {
  id: string;
  customer_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  role: string | null;
}

const formatCurrencyShort = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

const getContractMonths = (contract: Contract): number => {
  if (contract.meses_vigencia && contract.meses_vigencia > 0) {
    return contract.meses_vigencia;
  }
  return calculateMonthsBetween(contract.vigencia_inicial, contract.vigencia_final) || 1;
};

const RaioX = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const customerIdFromUrl = searchParams.get("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customerIdFromUrl);
  const [activeTab, setActiveTab] = useState("relacionamento");
  
  // Filter states for each tab
  const [relacionamentoFilter, setRelacionamentoFilter] = useState<TimeFilter>("month");
  const [relacionamentoPeriod, setRelacionamentoPeriod] = useState<PeriodFilter>("last_3_months");
  const [utilizacaoFilter, setUtilizacaoFilter] = useState<TimeFilter>("month");
  const [utilizacaoPeriod, setUtilizacaoPeriod] = useState<PeriodFilter>("last_3_months");
  const [suporteFilter, setSuporteFilter] = useState<TimeFilter>("month");
  const [suportePeriod, setSuportePeriod] = useState<PeriodFilter>("last_3_months");

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

  // Keyboard shortcuts for navigating between customers (Ctrl+J next, Ctrl+K previous)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!customers || customers.length === 0) return;

      const currentIndex = customers.findIndex(c => c.id === selectedCustomer?.id);

      if (e.ctrlKey && e.key === "j") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % customers.length;
        setSelectedCustomerId(customers[nextIndex].id);
      } else if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? customers.length - 1 : currentIndex - 1;
        setSelectedCustomerId(customers[prevIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customers, selectedCustomer]);

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

  // Fetch champions for selected customer
  const { data: champions } = useQuery({
    queryKey: ["customer-champions", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const { data, error } = await supabase
        .from("champions")
        .select("*")
        .eq("customer_id", selectedCustomer.id)
        .order("name");
      if (error) throw error;
      return data as Champion[];
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
      return { 
        mrrAtual: 0, 
        ltvRealizado: 0,
        ltvARealizar: 0,
        mesesAtivo: 0, 
        planoAtual: "-", 
        mesesRestantes: 0,
      };
    }

    const now = new Date();
    const activeContracts = contracts.filter(c => c.status_contrato?.toLowerCase() === "vigente");
    const mrrAtual = activeContracts.reduce((sum, c) => sum + (c.mrr || 0), 0);
    
    let ltvRealizado = 0;
    let ltvARealizar = 0;
    
    contracts.forEach(c => {
      const mrr = c.mrr || 0;
      const startDate = c.vigencia_inicial ? new Date(c.vigencia_inicial) : null;
      const endDate = c.vigencia_final ? new Date(c.vigencia_final) : null;
      
      if (!startDate) return;
      
      if (c.status_contrato?.toLowerCase() === "vencido" || (endDate && endDate < now)) {
        const months = getContractMonths(c);
        ltvRealizado += mrr * months;
      } else if (startDate <= now) {
        const monthsElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const monthsRemaining = endDate 
          ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
          : 0;
        
        ltvRealizado += mrr * monthsElapsed;
        ltvARealizar += mrr * monthsRemaining;
      } else {
        const months = getContractMonths(c);
        ltvARealizar += mrr * months;
      }
    });
    
    const mesesAtivo = calculateMonthsBetween(selectedCustomer.data_cohort, null);
    
    const latestContract = activeContracts
      .sort((a, b) => new Date(b.vigencia_inicial || 0).getTime() - new Date(a.vigencia_inicial || 0).getTime())[0];
    
    const planoAtual = latestContract?.tipo_documento || "-";
    
    const mesesRestantes = latestContract?.vigencia_final
      ? calculateMonthsRemaining(latestContract.vigencia_final)
      : 0;

    return { 
      mrrAtual,
      ltvRealizado,
      ltvARealizar,
      mesesAtivo, 
      planoAtual, 
      mesesRestantes,
    };
  }, [contracts, selectedCustomer]);

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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="relacionamento" className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Relacionamento</span>
            </TabsTrigger>
            <TabsTrigger value="utilizacao" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Utilização</span>
            </TabsTrigger>
            <TabsTrigger value="suporte" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Suporte</span>
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dados cadastrais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <CustomerDataTab
              customer={selectedCustomer}
              contracts={contracts || []}
              champions={champions || []}
              profiles={profiles || []}
            />
          </TabsContent>

          <TabsContent value="relacionamento" className="mt-6">
            <RelationshipTab
              customerName={selectedCustomer.nome_fantasia}
              actions={actions || []}
              filter={relacionamentoFilter}
              onFilterChange={setRelacionamentoFilter}
              periodValue={relacionamentoPeriod}
              onPeriodChange={setRelacionamentoPeriod}
            />
          </TabsContent>

          <TabsContent value="utilizacao" className="mt-6">
            <UsageTab
              filter={utilizacaoFilter}
              onFilterChange={setUtilizacaoFilter}
              periodValue={utilizacaoPeriod}
              onPeriodChange={setUtilizacaoPeriod}
            />
          </TabsContent>

          <TabsContent value="suporte" className="mt-6">
            <SupportTicketsSection 
              customerId={selectedCustomer.id} 
              filter={suporteFilter} 
              onFilterChange={setSuporteFilter}
              periodValue={suportePeriod}
              onPeriodChange={setSuportePeriod}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RaioX;
