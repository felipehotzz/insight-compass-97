import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import {
  arrData,
  clientsData,
  grossMarginData,
  netIncomeData,
  employeesData,
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
  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Visão Geral</h1>

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
