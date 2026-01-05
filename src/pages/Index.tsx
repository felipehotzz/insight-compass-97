import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { useLatestFinancialMetrics, formatMonthLabel } from "@/hooks/useFinancialMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  arrData,
  clientsData,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  `${(value / 1000).toFixed(0)}K`;

const arrSeries = [
  { key: "churn", name: "Churn", color: "hsl(var(--color-danger))" },
  { key: "mantido", name: "ARR Mantido", color: "hsl(var(--color-overview))" },
  { key: "novo", name: "Novo ARR", color: "hsl(var(--color-growth))" },
];

const clientsSeries = [
  { key: "churn", name: "Churn", color: "hsl(var(--color-danger))" },
  { key: "mantido", name: "Mantidos", color: "hsl(var(--color-overview))" },
  { key: "novo", name: "Novos", color: "hsl(var(--color-growth))" },
];

const Index = () => {
  const { data: metrics, isLoading } = useLatestFinancialMetrics(12);

  // Transform metrics for charts
  const grossMarginData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.gross_profit_margin ?? 0,
  })) || [];

  const netIncomeData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.net_income ?? 0,
  })) || [];

  const employeesData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.employees_count ?? 0,
  })) || [];

  const mrrData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.mrr ?? 0,
  })) || [];

  const ebitdaData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.ebitda ?? 0,
  })) || [];

  const cashBalanceData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.cash_balance ?? 0,
  })) || [];

  const hasRealData = metrics && metrics.length > 0;

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-xl text-foreground">Visão Geral</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="chart-container">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="ARR" subtitle="Evolução mensal">
                <StackedBarChart
                  data={arrData}
                  series={arrSeries}
                  height={300}
                  xAxisKey="month"
                  formatValue={formatCurrency}
                />
              </ChartCard>
              <ChartCard title="Nº de Clientes" subtitle="Evolução mensal">
                <StackedBarChart
                  data={clientsData}
                  series={clientsSeries}
                  height={300}
                  xAxisKey="month"
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title="Gross Margin (%)" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={grossMarginData}
                  formatValue={(v) => `${v.toFixed(1)}%`}
                  color="hsl(var(--color-overview))"
                />
              </ChartCard>
              <ChartCard 
                title="Net Income" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={netIncomeData}
                  formatValue={formatCurrency}
                  color="hsl(var(--color-overview))"
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title="MRR" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={mrrData}
                  formatValue={formatCurrency}
                  color="hsl(var(--color-growth))"
                />
              </ChartCard>
              <ChartCard 
                title="EBITDA" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={ebitdaData}
                  formatValue={formatCurrency}
                  color="hsl(var(--color-growth))"
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title="Nº de Colaboradores" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart data={employeesData} color="hsl(var(--color-overview))" />
              </ChartCard>
              <ChartCard 
                title="Saldo em Caixa" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={cashBalanceData}
                  formatValue={formatCurrency}
                  color="hsl(var(--color-growth))"
                />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;