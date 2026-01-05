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
  funnelData,
  funnelValueData,
  pipelineByMonth,
  opportunitiesByValue,
  lostReasons,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR");

const pipelineSeries = [
  { key: "pipeline", name: "Pipeline", color: "hsl(0 0% 70%)" },
  { key: "commit", name: "Commit", color: "hsl(0 0% 55%)" },
  { key: "bestCase", name: "Best Case", color: "hsl(0 0% 40%)" },
];

const Growth = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  const commitOpportunities = ["Grendene", "Syngenta", "CBMM"];
  const bestCaseOpportunities = ["Alpargatas", "SESC Nacional", "Metro BH", "Softplan"];

  return (
    <DashboardLayout title="Métricas de Growth">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <FilterButtons value={timeFilter} onChange={setTimeFilter} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Conversões Forms"
            value="156"
            trend={{ value: 12 }}
          />
          <StatCard
            title="Oportunidades Criadas"
            value="32"
            trend={{ value: 8 }}
          />
          <StatCard
            title="Oportunidades Abertas"
            value="47"
          />
          <StatCard
            title="Pipeline Gerado (R$)"
            value={formatCurrency(850000)}
            trend={{ value: 15 }}
          />
          <StatCard
            title="Pipeline Total (R$)"
            value={formatCurrency(2150000)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="stat-label">Forecast Commit (R$)</p>
            <p className="stat-value">{formatCurrency(427464)}</p>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Oportunidades:</p>
              <div className="flex flex-wrap gap-2">
                {commitOpportunities.map((opp) => (
                  <span key={opp} className="px-3 py-1 bg-secondary text-foreground/80 rounded text-sm">
                    {opp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <p className="stat-label">Forecast Best Case (R$)</p>
            <p className="stat-value">{formatCurrency(705900)}</p>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Oportunidades:</p>
              <div className="flex flex-wrap gap-2">
                {bestCaseOpportunities.map((opp) => (
                  <span key={opp} className="px-3 py-1 bg-secondary text-foreground/80 rounded text-sm">
                    {opp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Negócios em Andamento por Fase" subtitle="Quantidade">
            <FunnelChart data={funnelData} />
          </ChartCard>
          <ChartCard title="Valor em Andamento por Fase (R$)">
            <FunnelChart
              data={funnelValueData}
              formatValue={formatCurrency}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Previsão de Fechamento por Categoria (R$)" subtitle="Por mês">
            <StackedBarChart
              data={pipelineByMonth}
              series={pipelineSeries}
              formatValue={formatCurrency}
            />
          </ChartCard>
          <ChartCard title="Ranking de Oportunidades por Valor (R$)">
            <HorizontalBarChart
              data={opportunitiesByValue}
              formatValue={formatCurrency}
              color="hsl(0 0% 65%)"
            />
          </ChartCard>
        </div>

        <ChartCard title="Motivos de Perda" subtitle="Contagem de negócios">
          <SimpleBarChart
            data={lostReasons}
            color="hsl(0 0% 60%)"
            height={280}
          />
        </ChartCard>
      </div>
    </DashboardLayout>
  );
};

export default Growth;
