import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
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

const formatCurrencyFull = (value: number) =>
  value.toLocaleString("pt-BR");

const Index = () => {
  const currentARR = arrData[arrData.length - 1].value;
  const currentClients = clientsData[clientsData.length - 1].value;
  const currentGrossMargin = grossMarginData[grossMarginData.length - 1].value;
  const currentNetIncome = netIncomeData[netIncomeData.length - 1].value;
  const currentEmployees = employeesData[employeesData.length - 1].value;
  const revenuePerEmployee = Math.round(currentARR / currentEmployees);

  const prevARR = arrData[arrData.length - 2].value;
  const prevClients = clientsData[clientsData.length - 2].value;
  const prevGrossMargin = grossMarginData[grossMarginData.length - 2].value;

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Visão Geral</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ARR (R$)"
            value={formatCurrencyFull(currentARR)}
            trend={{ value: Number((((currentARR - prevARR) / prevARR) * 100).toFixed(1)) }}
          />
          <StatCard
            title="Nº de Clientes"
            value={currentClients}
            trend={{ value: Number((((currentClients - prevClients) / prevClients) * 100).toFixed(1)) }}
          />
          <StatCard
            title="Gross Margin"
            value={`${currentGrossMargin}%`}
            trend={{ value: currentGrossMargin - prevGrossMargin }}
          />
          <StatCard
            title="Net Income (R$)"
            value={formatCurrencyFull(currentNetIncome)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Cash Flow - Início do Período (R$)"
            value={formatCurrencyFull(2500000)}
          />
          <StatCard
            title="Cash Flow - Fim do Período (R$)"
            value={formatCurrencyFull(2850000)}
            trend={{ value: 14 }}
          />
          <StatCard
            title="Nº Colaboradores"
            value={currentEmployees}
            subtitle={`Revenue/Employee: ${formatCurrencyFull(revenuePerEmployee)}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="ARR" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={arrData}
              formatValue={formatCurrency}
              previousDataKey="previousValue"
            />
          </ChartCard>
          <ChartCard title="Nº de Clientes" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={clientsData}
              previousDataKey="previousValue"
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Gross Margin (%)" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={grossMarginData}
              formatValue={(v) => `${v}%`}
            />
          </ChartCard>
          <ChartCard title="Net Income" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={netIncomeData}
              formatValue={formatCurrency}
            />
          </ChartCard>
        </div>

        <ChartCard title="Nº de Colaboradores" subtitle="Evolução mensal">
          <MonthlyLineChart data={employeesData} />
        </ChartCard>
      </div>
    </DashboardLayout>
  );
};

export default Index;
