import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import {
  arrData,
  clientsData,
  grossMarginData,
  netIncomeData,
  employeesData,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  `${(value / 1000).toFixed(0)}K`;

const Index = () => {
  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Visão Geral</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="ARR" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={arrData}
              formatValue={formatCurrency}
              previousDataKey="previousValue"
              color="hsl(var(--color-overview))"
            />
          </ChartCard>
          <ChartCard title="Nº de Clientes" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={clientsData}
              previousDataKey="previousValue"
              color="hsl(var(--color-overview))"
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Gross Margin (%)" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={grossMarginData}
              formatValue={(v) => `${v}%`}
              color="hsl(var(--color-overview))"
            />
          </ChartCard>
          <ChartCard title="Net Income" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={netIncomeData}
              formatValue={formatCurrency}
              color="hsl(var(--color-overview))"
            />
          </ChartCard>
        </div>

        <ChartCard title="Nº de Colaboradores" subtitle="Evolução mensal">
          <MonthlyLineChart data={employeesData} color="hsl(var(--color-overview))" />
        </ChartCard>
      </div>
    </DashboardLayout>
  );
};

export default Index;
