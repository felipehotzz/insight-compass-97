import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import {
  FileText,
  Target,
  Briefcase,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  funnelData,
  funnelValueData,
  pipelineByMonth,
  opportunitiesByValue,
  lostReasons,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR")}`;

const pipelineSeries = [
  { key: "pipeline", name: "Pipeline", color: "hsl(var(--chart-1))" },
  { key: "commit", name: "Commit", color: "hsl(var(--chart-2))" },
  { key: "bestCase", name: "Best Case", color: "hsl(var(--chart-3))" },
];

const Growth = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  // Opportunities list (mock)
  const commitOpportunities = ["Grendene", "Syngenta", "CBMM"];
  const bestCaseOpportunities = ["Alpargatas", "SESC Nacional", "Metro BH", "Softplan"];

  return (
    <DashboardLayout title="Métricas de Growth">
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex justify-end">
          <FilterButtons value={timeFilter} onChange={setTimeFilter} />
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Conversões Forms"
            value="156"
            trend={{ value: 12 }}
            icon={<FileText className="h-5 w-5" />}
          />
          <StatCard
            title="Oportunidades Criadas"
            value="32"
            trend={{ value: 8 }}
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            title="Oportunidades Abertas"
            value="47"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            title="Pipeline Gerado"
            value={formatCurrency(850000)}
            trend={{ value: 15 }}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Pipeline Total"
            value={formatCurrency(2150000)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Forecast Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-chart-2/20 p-2">
                <DollarSign className="h-5 w-5 text-[hsl(var(--chart-2))]" />
              </div>
              <div>
                <p className="stat-label">Forecast Commit</p>
                <p className="stat-value">{formatCurrency(427464)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Oportunidades:</p>
              <div className="flex flex-wrap gap-2">
                {commitOpportunities.map((opp) => (
                  <span key={opp} className="px-3 py-1 bg-chart-2/20 text-[hsl(var(--chart-2))] rounded-full text-sm">
                    {opp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-chart-3/20 p-2">
                <DollarSign className="h-5 w-5 text-[hsl(var(--chart-3))]" />
              </div>
              <div>
                <p className="stat-label">Forecast Best Case</p>
                <p className="stat-value">{formatCurrency(705900)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Oportunidades:</p>
              <div className="flex flex-wrap gap-2">
                {bestCaseOpportunities.map((opp) => (
                  <span key={opp} className="px-3 py-1 bg-chart-3/20 text-[hsl(var(--chart-3))] rounded-full text-sm">
                    {opp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Negócios em Andamento por Fase" subtitle="Quantidade">
            <FunnelChart data={funnelData} />
          </ChartCard>
          <ChartCard title="Valor em Andamento por Fase" subtitle="R$">
            <FunnelChart
              data={funnelValueData}
              formatValue={formatCurrency}
            />
          </ChartCard>
        </div>

        {/* Pipeline & Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Previsão de Fechamento por Categoria" subtitle="Por mês">
            <StackedBarChart
              data={pipelineByMonth}
              series={pipelineSeries}
              formatValue={formatCurrency}
            />
          </ChartCard>
          <ChartCard title="Ranking de Oportunidades por Valor">
            <HorizontalBarChart
              data={opportunitiesByValue}
              formatValue={formatCurrency}
              color="hsl(var(--chart-coral))"
            />
          </ChartCard>
        </div>

        {/* Lost Reasons */}
        <ChartCard title="Motivos de Perda" subtitle="Contagem de negócios">
          <SimpleBarChart
            data={lostReasons}
            color="hsl(var(--chart-coral))"
            height={280}
          />
        </ChartCard>
      </div>
    </DashboardLayout>
  );
};

export default Growth;
