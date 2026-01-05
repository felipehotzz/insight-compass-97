import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { ChannelBreakdownChart, generateGeneralChannelData, generateGeneralDispatchData } from "@/components/charts/ChannelBreakdownChart";
import { SupportBreakdownChart, generateGeneralOpenedTicketsData, generateGeneralClosedTicketsData, generateGeneralBacklogData } from "@/components/charts/SupportBreakdownChart";
import { SimpleLineChart, generateGeneralUsersData, generateGeneralCollaboratorsData } from "@/components/charts/SimpleLineChart";
import { ActionBreakdownChart, generateGlobalActionsData } from "@/components/charts/ActionBreakdownChart";
import { ActionThemeChart, generateGlobalActionsThemeData } from "@/components/charts/ActionThemeChart";
import { Calendar, Headphones, Activity, ChevronDown, ChevronUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  customersByPlan,
  customersByCS,
  ticketsByType,
  ticketsByCustomer,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR");

type CompositionFilter = "month" | "quarter";

// Mock data for customer composition over time
const getCustomerCompositionData = (filter: CompositionFilter) => {
  if (filter === "month") {
    return [
      { name: "Jan", novos: 5, mantidos: 48, churn: 2 },
      { name: "Fev", novos: 3, mantidos: 51, churn: 1 },
      { name: "Mar", novos: 6, mantidos: 53, churn: 3 },
      { name: "Abr", novos: 4, mantidos: 54, churn: 2 },
      { name: "Mai", novos: 7, mantidos: 55, churn: 1 },
      { name: "Jun", novos: 5, mantidos: 58, churn: 2 },
    ];
  }
  return [
    { name: "Q1 2025", novos: 14, mantidos: 48, churn: 6 },
    { name: "Q2 2025", novos: 16, mantidos: 54, churn: 5 },
    { name: "Q3 2025", novos: 12, mantidos: 58, churn: 4 },
    { name: "Q4 2025", novos: 18, mantidos: 60, churn: 3 },
  ];
};

// Mock data for plan composition over time
const getPlanCompositionData = (filter: CompositionFilter) => {
  if (filter === "month") {
    return [
      { name: "Jan", starter: 20, pro: 25, enterprise: 8 },
      { name: "Fev", starter: 21, pro: 26, enterprise: 8 },
      { name: "Mar", starter: 22, pro: 27, enterprise: 9 },
      { name: "Abr", starter: 20, pro: 28, enterprise: 10 },
      { name: "Mai", starter: 21, pro: 30, enterprise: 10 },
      { name: "Jun", starter: 22, pro: 28, enterprise: 11 },
    ];
  }
  return [
    { name: "Q1 2025", starter: 20, pro: 25, enterprise: 8 },
    { name: "Q2 2025", starter: 21, pro: 28, enterprise: 9 },
    { name: "Q3 2025", starter: 22, pro: 30, enterprise: 10 },
    { name: "Q4 2025", starter: 22, pro: 28, enterprise: 11 },
  ];
};

// Mock data for top/bottom customers by communications
const getTopCustomersByCommunications = (filter: TimeFilter) => {
  const data: Record<string, { name: string; value: number }[]> = {
    day: [
      { name: "Grendene", value: 1850 },
      { name: "Syngenta", value: 1620 },
      { name: "CBMM", value: 1480 },
      { name: "Alpargatas", value: 1350 },
      { name: "SESC Nacional", value: 1220 },
    ],
    week: [
      { name: "Grendene", value: 8500 },
      { name: "Syngenta", value: 7800 },
      { name: "CBMM", value: 7200 },
      { name: "Alpargatas", value: 6500 },
      { name: "SESC Nacional", value: 5900 },
    ],
    month: [
      { name: "Grendene", value: 32500 },
      { name: "Syngenta", value: 28400 },
      { name: "CBMM", value: 25800 },
      { name: "Alpargatas", value: 22100 },
      { name: "SESC Nacional", value: 19500 },
    ],
    quarter: [
      { name: "Grendene", value: 95000 },
      { name: "Syngenta", value: 84500 },
      { name: "CBMM", value: 76200 },
      { name: "Alpargatas", value: 68900 },
      { name: "SESC Nacional", value: 61200 },
    ],
  };
  return data[filter] || data.month;
};

const getBottomCustomersByCommunications = (filter: TimeFilter) => {
  const data: Record<string, { name: string; value: number }[]> = {
    day: [
      { name: "CJ do Brasil", value: 120 },
      { name: "Caixa Consórcios", value: 185 },
      { name: "Eucatex", value: 250 },
      { name: "Softplan", value: 320 },
      { name: "Metro BH", value: 410 },
    ],
    week: [
      { name: "CJ do Brasil", value: 580 },
      { name: "Caixa Consórcios", value: 820 },
      { name: "Eucatex", value: 1100 },
      { name: "Softplan", value: 1450 },
      { name: "Metro BH", value: 1850 },
    ],
    month: [
      { name: "CJ do Brasil", value: 2200 },
      { name: "Caixa Consórcios", value: 3100 },
      { name: "Eucatex", value: 4200 },
      { name: "Softplan", value: 5500 },
      { name: "Metro BH", value: 7100 },
    ],
    quarter: [
      { name: "CJ do Brasil", value: 6800 },
      { name: "Caixa Consórcios", value: 9500 },
      { name: "Eucatex", value: 12800 },
      { name: "Softplan", value: 16500 },
      { name: "Metro BH", value: 21500 },
    ],
  };
  return data[filter] || data.month;
};

// Mock data for tickets by type based on filter
const getTicketsByType = (filter: TimeFilter) => {
  const data: Record<string, { name: string; value: number }[]> = {
    day: [
      { name: "In App", value: 3 },
      { name: "Solicitação de Relatório", value: 2 },
      { name: "Bounce", value: 1 },
      { name: "Bug", value: 1 },
      { name: "Colaborador sem acesso", value: 1 },
      { name: "Dúvidas de Utilização", value: 1 },
      { name: "Inclusão de Logo", value: 0 },
    ],
    week: [
      { name: "In App", value: 14 },
      { name: "Solicitação de Relatório", value: 7 },
      { name: "Bounce", value: 5 },
      { name: "Bug", value: 3 },
      { name: "Colaborador sem acesso", value: 4 },
      { name: "Dúvidas de Utilização", value: 4 },
      { name: "Inclusão de Logo", value: 2 },
    ],
    month: [
      { name: "In App", value: 52 },
      { name: "Solicitação de Relatório", value: 28 },
      { name: "Bounce", value: 18 },
      { name: "Bug", value: 12 },
      { name: "Colaborador sem acesso", value: 15 },
      { name: "Dúvidas de Utilização", value: 16 },
      { name: "Inclusão de Logo", value: 8 },
    ],
    quarter: [
      { name: "In App", value: 156 },
      { name: "Solicitação de Relatório", value: 84 },
      { name: "Bounce", value: 54 },
      { name: "Bug", value: 36 },
      { name: "Colaborador sem acesso", value: 45 },
      { name: "Dúvidas de Utilização", value: 48 },
      { name: "Inclusão de Logo", value: 24 },
    ],
  };
  return data[filter] || data.month;
};

// Mock data for tickets by customer based on filter
const getTicketsByCustomer = (filter: TimeFilter) => {
  const data: Record<string, { name: string; value: number }[]> = {
    day: [
      { name: "In App", value: 3 },
      { name: "Comunica.In", value: 2 },
      { name: "Jeffrey Group", value: 1 },
      { name: "Alpargatas", value: 1 },
      { name: "Mercedes Benz", value: 1 },
    ],
    week: [
      { name: "In App", value: 14 },
      { name: "Comunica.In", value: 12 },
      { name: "Jeffrey Group", value: 7 },
      { name: "Alpargatas", value: 4 },
      { name: "Mercedes Benz", value: 3 },
    ],
    month: [
      { name: "In App", value: 52 },
      { name: "Comunica.In", value: 45 },
      { name: "Jeffrey Group", value: 28 },
      { name: "Alpargatas", value: 16 },
      { name: "Mercedes Benz", value: 12 },
    ],
    quarter: [
      { name: "In App", value: 156 },
      { name: "Comunica.In", value: 135 },
      { name: "Jeffrey Group", value: 84 },
      { name: "Alpargatas", value: 48 },
      { name: "Mercedes Benz", value: 36 },
    ],
  };
  return data[filter] || data.month;
};

// Mock data for renewals list
type RenewalStatus = "ongoing" | "not_started";

interface RenewalItem {
  id: number;
  customer: string;
  contractValue: number;
  renewalDate: string;
  status: RenewalStatus;
  period: "30" | "90" | "180";
}

const renewalsList: RenewalItem[] = [
  // Next 30 days
  { id: 1, customer: "Grendene", contractValue: 45000, renewalDate: "2026-01-20", status: "ongoing", period: "30" },
  { id: 2, customer: "Syngenta", contractValue: 38000, renewalDate: "2026-01-25", status: "ongoing", period: "30" },
  { id: 3, customer: "CBMM", contractValue: 32000, renewalDate: "2026-01-28", status: "not_started", period: "30" },
  { id: 4, customer: "Alpargatas", contractValue: 28000, renewalDate: "2026-02-01", status: "ongoing", period: "30" },
  { id: 5, customer: "SESC Nacional", contractValue: 22000, renewalDate: "2026-02-03", status: "not_started", period: "30" },
  { id: 6, customer: "Metro BH", contractValue: 15000, renewalDate: "2026-02-05", status: "not_started", period: "30" },
  // Next 90 days
  { id: 7, customer: "Softplan", contractValue: 52000, renewalDate: "2026-02-15", status: "ongoing", period: "90" },
  { id: 8, customer: "Eucatex", contractValue: 41000, renewalDate: "2026-02-28", status: "ongoing", period: "90" },
  { id: 9, customer: "Caixa Consórcios", contractValue: 35000, renewalDate: "2026-03-10", status: "not_started", period: "90" },
  { id: 10, customer: "CJ do Brasil", contractValue: 29000, renewalDate: "2026-03-20", status: "ongoing", period: "90" },
  { id: 11, customer: "TechCorp", contractValue: 48000, renewalDate: "2026-03-25", status: "not_started", period: "90" },
  { id: 12, customer: "InnovateBR", contractValue: 36000, renewalDate: "2026-04-01", status: "not_started", period: "90" },
  { id: 13, customer: "DataSolutions", contractValue: 42000, renewalDate: "2026-04-05", status: "ongoing", period: "90" },
  // Next 180 days
  { id: 14, customer: "CloudBR", contractValue: 55000, renewalDate: "2026-04-20", status: "ongoing", period: "180" },
  { id: 15, customer: "FinanceHub", contractValue: 62000, renewalDate: "2026-05-01", status: "not_started", period: "180" },
  { id: 16, customer: "RetailMax", contractValue: 38000, renewalDate: "2026-05-15", status: "ongoing", period: "180" },
  { id: 17, customer: "LogisTech", contractValue: 44000, renewalDate: "2026-05-28", status: "not_started", period: "180" },
  { id: 18, customer: "HealthPlus", contractValue: 51000, renewalDate: "2026-06-10", status: "ongoing", period: "180" },
  { id: 19, customer: "EduTech", contractValue: 33000, renewalDate: "2026-06-20", status: "not_started", period: "180" },
  { id: 20, customer: "AgriSmart", contractValue: 47000, renewalDate: "2026-06-30", status: "ongoing", period: "180" },
];

// Mock data for customers by CS manager
const customersByCSDetails: Record<string, { name: string; plan: string; contractValue: number }[]> = {
  "Daniel Santos": [
    { name: "Grendene", plan: "Enterprise", contractValue: 45000 },
    { name: "Alpargatas", plan: "Business", contractValue: 28000 },
    { name: "SESC Nacional", plan: "Enterprise", contractValue: 55000 },
    { name: "Metro BH", plan: "Professional", contractValue: 18000 },
    { name: "TechCorp", plan: "Enterprise", contractValue: 48000 },
    { name: "CloudBR", plan: "Business", contractValue: 35000 },
    { name: "FinanceHub", plan: "Enterprise", contractValue: 62000 },
    { name: "RetailMax", plan: "Professional", contractValue: 22000 },
    { name: "LogisTech", plan: "Business", contractValue: 44000 },
    { name: "HealthPlus", plan: "Enterprise", contractValue: 51000 },
    { name: "EduTech", plan: "Professional", contractValue: 33000 },
    { name: "AgriSmart", plan: "Business", contractValue: 47000 },
    { name: "DataSolutions", plan: "Enterprise", contractValue: 42000 },
    { name: "InnovateBR", plan: "Professional", contractValue: 36000 },
    { name: "Eucatex", plan: "Business", contractValue: 25000 },
    { name: "Softplan", plan: "Professional", contractValue: 29000 },
    { name: "CJ do Brasil", plan: "Starter", contractValue: 12000 },
    { name: "Caixa Consórcios", plan: "Starter", contractValue: 15000 },
  ],
  "Eduardo Carvalho": [
    { name: "Syngenta", plan: "Enterprise", contractValue: 68000 },
    { name: "CBMM", plan: "Enterprise", contractValue: 72000 },
    { name: "Natura", plan: "Business", contractValue: 38000 },
    { name: "Localiza", plan: "Enterprise", contractValue: 55000 },
    { name: "Ambev", plan: "Enterprise", contractValue: 85000 },
    { name: "Bayer", plan: "Business", contractValue: 42000 },
    { name: "Votorantim", plan: "Enterprise", contractValue: 63000 },
    { name: "JBS", plan: "Business", contractValue: 48000 },
    { name: "BRF", plan: "Professional", contractValue: 31000 },
    { name: "Marfrig", plan: "Business", contractValue: 35000 },
    { name: "Cosan", plan: "Professional", contractValue: 28000 },
    { name: "Raízen", plan: "Enterprise", contractValue: 58000 },
    { name: "Suzano", plan: "Business", contractValue: 44000 },
    { name: "Klabin", plan: "Professional", contractValue: 32000 },
    { name: "Weg", plan: "Enterprise", contractValue: 52000 },
    { name: "Embraer", plan: "Enterprise", contractValue: 78000 },
    { name: "Totvs", plan: "Business", contractValue: 39000 },
    { name: "Linx", plan: "Professional", contractValue: 26000 },
    { name: "Cielo", plan: "Business", contractValue: 41000 },
    { name: "Stone", plan: "Professional", contractValue: 33000 },
    { name: "PagSeguro", plan: "Starter", contractValue: 18000 },
    { name: "Nubank", plan: "Enterprise", contractValue: 72000 },
  ],
  "Jessica Bueno": [
    { name: "Magazine Luiza", plan: "Enterprise", contractValue: 88000 },
    { name: "B2W", plan: "Enterprise", contractValue: 75000 },
    { name: "Via Varejo", plan: "Business", contractValue: 52000 },
    { name: "Lojas Americanas", plan: "Enterprise", contractValue: 68000 },
    { name: "Renner", plan: "Business", contractValue: 45000 },
    { name: "Riachuelo", plan: "Professional", contractValue: 32000 },
    { name: "C&A", plan: "Business", contractValue: 48000 },
    { name: "Hering", plan: "Professional", contractValue: 28000 },
    { name: "Arezzo", plan: "Business", contractValue: 38000 },
    { name: "Vivara", plan: "Professional", contractValue: 25000 },
    { name: "Grupo Soma", plan: "Enterprise", contractValue: 55000 },
    { name: "Track&Field", plan: "Professional", contractValue: 22000 },
    { name: "Centauro", plan: "Business", contractValue: 42000 },
    { name: "Netshoes", plan: "Professional", contractValue: 29000 },
    { name: "Dafiti", plan: "Business", contractValue: 35000 },
    { name: "Zattini", plan: "Starter", contractValue: 15000 },
    { name: "Tricae", plan: "Starter", contractValue: 12000 },
    { name: "Kanui", plan: "Starter", contractValue: 10000 },
    { name: "Posthaus", plan: "Starter", contractValue: 8000 },
    { name: "Mobly", plan: "Professional", contractValue: 31000 },
  ],
};

const customerSeries = [
  { key: "churn", name: "Churn", color: "hsl(var(--color-danger))" },
  { key: "mantidos", name: "Mantidos", color: "hsl(var(--color-overview))" },
  { key: "novos", name: "Novos", color: "hsl(var(--color-growth))" },
];

const planSeries = [
  { key: "starter", name: "Starter", color: "hsl(var(--color-customers-alt))" },
  { key: "pro", name: "Pro", color: "hsl(var(--color-customers))" },
  { key: "enterprise", name: "Enterprise", color: "hsl(var(--color-growth-alt))" },
];

const Customers = () => {
  const [compositionFilter, setCompositionFilter] = useState<CompositionFilter>("month");
  const [relationshipFilter, setRelationshipFilter] = useState<TimeFilter>("month");
  const [usageFilter, setUsageFilter] = useState<TimeFilter>("month");
  const [supportFilter, setSupportFilter] = useState<TimeFilter>("month");
  const [renewalsOpen, setRenewalsOpen] = useState(false);
  const [renewalsPeriod, setRenewalsPeriod] = useState<"30" | "90" | "180">("30");
  const [selectedCS, setSelectedCS] = useState<string | null>(null);

  const customerCompositionData = getCustomerCompositionData(compositionFilter);
  const planCompositionData = getPlanCompositionData(compositionFilter);

  // Filter renewals by period
  const filteredRenewals = renewalsList.filter(r => {
    if (renewalsPeriod === "30") return r.period === "30";
    if (renewalsPeriod === "90") return r.period === "30" || r.period === "90";
    return true; // 180 shows all
  });

  // Group by status
  const ongoingRenewals = filteredRenewals.filter(r => r.status === "ongoing");
  const notStartedRenewals = filteredRenewals.filter(r => r.status === "not_started");

  const handleCSBarClick = (data: { name: string; value: number }) => {
    setSelectedCS(data.name);
  };

  const selectedCSCustomers = selectedCS ? customersByCSDetails[selectedCS] || [] : [];


  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        {/* Customer Composition Charts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setCompositionFilter("month")}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  compositionFilter === "month"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setCompositionFilter("quarter")}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  compositionFilter === "quarter"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Trimestre
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Número de Clientes">
              <StackedBarChart
                data={customerCompositionData}
                series={customerSeries}
                height={280}
                showTotalLine={true}
                totalLabel="Total de Clientes"
              />
            </ChartCard>
            <ChartCard title="Nº de Clientes por Plano">
              <StackedBarChart
                data={planCompositionData}
                series={planSeries}
                height={280}
              />
            </ChartCard>
          </div>
        </div>

        {/* Relationship Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Relacionamento</h2>
            <FilterButtons value={relationshipFilter} onChange={setRelationshipFilter} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Ações por tipo">
              <ActionBreakdownChart data={generateGlobalActionsData(relationshipFilter)} />
            </ChartCard>
            <ChartCard title="Ações por tema">
              <ActionThemeChart data={generateGlobalActionsThemeData(relationshipFilter)} />
            </ChartCard>
          </div>
        </div>

        {/* CS Customers Modal */}
        <Dialog open={!!selectedCS} onOpenChange={(open) => !open && setSelectedCS(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Clientes de {selectedCS}</span>
                <Badge variant="secondary">{selectedCSCustomers.length} clientes</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="border-t border-border">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-secondary/30 text-xs font-medium text-muted-foreground uppercase">
                <span>Cliente</span>
                <span>Plano</span>
                <span>Valor do Contrato</span>
              </div>
              {/* List */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                {selectedCSCustomers.map((customer, index) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors items-center"
                  >
                    <span className="text-sm font-medium">{customer.name}</span>
                    <Badge variant="outline" className="w-fit text-xs">
                      {customer.plan}
                    </Badge>
                    <span className="text-sm">R$ {formatCurrency(customer.contractValue)}</span>
                  </div>
                ))}
              </div>
              {/* Footer with total */}
              <div className="border-t border-border px-4 py-3 bg-secondary/20">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>R$ {formatCurrency(selectedCSCustomers.reduce((sum, c) => sum + c.contractValue, 0))}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="$ por Plano (R$)">
            <div className="flex flex-col h-[280px]">
              <div className="grid grid-cols-2 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <span>Plano</span>
                <span className="text-right">Valor</span>
              </div>
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {customersByPlan.map((plan) => (
                  <div key={plan.name} className="grid grid-cols-2 gap-4 px-2 py-3 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">{plan.name}</span>
                    <span className="text-sm text-right">R$ {formatCurrency(plan.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 px-2 py-3 border-t border-border bg-secondary/20 mt-auto">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-medium text-right">R$ {formatCurrency(customersByPlan.reduce((sum, p) => sum + p.amount, 0))}</span>
              </div>
            </div>
          </ChartCard>
          <ChartCard title="$ por CS (R$)">
            <div className="flex flex-col h-[280px]">
              <div className="grid grid-cols-2 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <span>CS</span>
                <span className="text-right">Valor</span>
              </div>
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {customersByCS.map((cs) => (
                  <div key={cs.name} className="grid grid-cols-2 gap-4 px-2 py-3 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">{cs.name}</span>
                    <span className="text-sm text-right">R$ {formatCurrency(cs.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 px-2 py-3 border-t border-border bg-secondary/20 mt-auto">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-medium text-right">R$ {formatCurrency(customersByCS.reduce((sum, c) => sum + c.amount, 0))}</span>
              </div>
            </div>
          </ChartCard>
          <ChartCard title="Clientes por CS">
            <div className="flex flex-col h-[280px]">
              <div className="grid grid-cols-2 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <span>CS</span>
                <span className="text-right">Clientes</span>
              </div>
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {customersByCS.map((cs) => (
                  <div 
                    key={cs.name} 
                    className="grid grid-cols-2 gap-4 px-2 py-3 hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedCS(cs.name)}
                  >
                    <span className="text-sm font-medium">{cs.name}</span>
                    <span className="text-sm text-right">{cs.value}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 px-2 py-3 border-t border-border bg-secondary/20 mt-auto">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-medium text-right">{customersByCS.reduce((sum, c) => sum + c.value, 0)}</span>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Renewals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Renovações
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setRenewalsPeriod("30")}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  renewalsPeriod === "30"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                30 dias
              </button>
              <button
                onClick={() => setRenewalsPeriod("90")}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  renewalsPeriod === "90"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                90 dias
              </button>
              <button
                onClick={() => setRenewalsPeriod("180")}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  renewalsPeriod === "180"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                180 dias
              </button>
            </div>
          </div>
          <div className="glass-card">
            <Collapsible open={renewalsOpen} onOpenChange={setRenewalsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors rounded-t">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{filteredRenewals.length} renovações pendentes</span>
                    <span className="text-sm text-muted-foreground">
                      R$ {formatCurrency(filteredRenewals.reduce((sum, r) => sum + r.contractValue, 0))} em contratos
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {renewalsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border">
                  {/* Header */}
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-secondary/30 text-xs font-medium text-muted-foreground uppercase">
                    <span>Cliente</span>
                    <span>Valor do Contrato</span>
                    <span>Data de Renovação</span>
                  </div>
                  {/* List grouped by status */}
                  <div className="max-h-[500px] overflow-y-auto">
                    {/* Em tratativa section */}
                    {ongoingRenewals.length > 0 && (
                      <>
                        <div className="px-4 py-3 bg-primary/10 border-l-4 border-l-primary">
                          <span className="text-sm font-semibold text-primary">Em tratativa</span>
                          <span className="ml-2 text-xs text-muted-foreground">({ongoingRenewals.length})</span>
                        </div>
                        <div className="divide-y divide-border">
                          {ongoingRenewals.map((renewal) => (
                            <div 
                              key={renewal.id} 
                              className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors items-center"
                            >
                              <span className="text-sm font-medium">{renewal.customer}</span>
                              <span className="text-sm">R$ {formatCurrency(renewal.contractValue)}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(renewal.renewalDate).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Não iniciado section */}
                    {notStartedRenewals.length > 0 && (
                      <>
                        <div className="px-4 py-3 bg-muted/50 border-l-4 border-l-muted-foreground">
                          <span className="text-sm font-semibold text-muted-foreground">Não iniciado</span>
                          <span className="ml-2 text-xs text-muted-foreground">({notStartedRenewals.length})</span>
                        </div>
                        <div className="divide-y divide-border">
                          {notStartedRenewals.map((renewal) => (
                            <div 
                              key={renewal.id} 
                              className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors items-center"
                            >
                              <span className="text-sm font-medium">{renewal.customer}</span>
                              <span className="text-sm">R$ {formatCurrency(renewal.contractValue)}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(renewal.renewalDate).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Usage Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Utilização (Geral)
            </h2>
            <FilterButtons value={usageFilter} onChange={setUsageFilter} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <ChartCard title="Comunicados Enviados" subtitle="Por canal">
              <ChannelBreakdownChart data={generateGeneralChannelData(usageFilter)} showAverage />
            </ChartCard>
            <ChartCard title="Disparos Totais" subtitle="Por canal">
              <ChannelBreakdownChart data={generateGeneralDispatchData(usageFilter)} showAverage />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <ChartCard title="Usuários na Base" subtitle="Evolução ao longo do tempo">
              <SimpleLineChart data={generateGeneralUsersData(usageFilter)} />
            </ChartCard>
            <ChartCard title="Colaboradores Cadastrados" subtitle="Evolução ao longo do tempo">
              <SimpleLineChart data={generateGeneralCollaboratorsData(usageFilter)} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Top Clientes" subtitle="Mais comunicados enviados">
              <HorizontalBarChart
                data={getTopCustomersByCommunications(usageFilter)}
                color="hsl(var(--color-usage))"
                height={200}
              />
            </ChartCard>
            <ChartCard title="Bottom Clientes" subtitle="Menos comunicados enviados">
              <HorizontalBarChart
                data={getBottomCustomersByCommunications(usageFilter)}
                color="hsl(var(--color-danger))"
                height={200}
              />
            </ChartCard>
          </div>
        </div>

        {/* Support Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Headphones className="h-4 w-4 text-muted-foreground" />
              Suporte
            </h2>
            <FilterButtons value={supportFilter} onChange={setSupportFilter} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Chamados Abertos" subtitle="Por nível">
              <SupportBreakdownChart data={generateGeneralOpenedTicketsData(supportFilter)} />
            </ChartCard>
            <ChartCard title="Chamados Fechados" subtitle="Por nível">
              <SupportBreakdownChart data={generateGeneralClosedTicketsData(supportFilter)} />
            </ChartCard>
            <ChartCard title="Backlog" subtitle="Por nível">
              <SupportBreakdownChart data={generateGeneralBacklogData(supportFilter)} />
            </ChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Volume por Tipo de Chamado">
            <div className="flex flex-col h-[320px]">
              <div className="grid grid-cols-2 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <span>Tipo</span>
                <span className="text-right">Quantidade</span>
              </div>
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {getTicketsByType(supportFilter).sort((a, b) => b.value - a.value).map((ticket) => (
                  <div key={ticket.name} className="grid grid-cols-2 gap-4 px-2 py-3 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">{ticket.name}</span>
                    <span className="text-sm text-right">{ticket.value}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 px-2 py-3 border-t border-border bg-secondary/20 mt-auto">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-medium text-right">{getTicketsByType(supportFilter).reduce((sum, t) => sum + t.value, 0)}</span>
              </div>
            </div>
          </ChartCard>
          <ChartCard title="Chamados por Cliente">
            <div className="flex flex-col h-[320px]">
              <div className="grid grid-cols-2 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <span>Cliente</span>
                <span className="text-right">Chamados</span>
              </div>
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {getTicketsByCustomer(supportFilter).sort((a, b) => b.value - a.value).map((customer) => (
                  <div key={customer.name} className="grid grid-cols-2 gap-4 px-2 py-3 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">{customer.name}</span>
                    <span className="text-sm text-right">{customer.value}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 px-2 py-3 border-t border-border bg-secondary/20 mt-auto">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-medium text-right">{getTicketsByCustomer(supportFilter).reduce((sum, c) => sum + c.value, 0)}</span>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
