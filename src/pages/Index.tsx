import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import { useLatestFinancialMetrics, formatMonthLabel } from "@/hooks/useFinancialMetrics";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) =>
  `${(value / 1000).toFixed(0)}K`;

const formatMillions = (value: number) =>
  `${(value / 1000000).toFixed(1)}M`;

const Index = () => {
  const { data: metrics, isLoading } = useLatestFinancialMetrics(12);

  // Transform metrics for charts
  const arrData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.arr ?? 0,
  })) || [];

  const mrrData = metrics?.map((m) => ({
    month: formatMonthLabel(m.period_date),
    value: m.mrr ?? 0,
  })) || [];

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
              <ChartCard 
                title="ARR" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={arrData}
                  formatValue={formatMillions}
                  color="hsl(var(--color-growth))"
                />
              </ChartCard>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title="Gross Margin (%)" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={grossMarginData}
                  formatValue={(v) => `${v.toFixed(0)}%`}
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
                title="EBITDA" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={ebitdaData}
                  formatValue={formatCurrency}
                  color="hsl(var(--color-growth))"
                />
              </ChartCard>
              <ChartCard 
                title="Saldo em Caixa" 
                subtitle={hasRealData ? "Dados reais da DRE" : "Dados de exemplo"}
              >
                <MonthlyLineChart
                  data={cashBalanceData}
                  formatValue={formatMillions}
                  color="hsl(var(--color-growth))"
                />
              </ChartCard>
            </div>

            {hasRealData && employeesData.some(d => d.value > 0) && (
              <ChartCard 
                title="Nº de Colaboradores" 
                subtitle="Dados reais da DRE"
              >
                <MonthlyLineChart data={employeesData} color="hsl(var(--color-overview))" />
              </ChartCard>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;