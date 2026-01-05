import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import {
  DollarSign,
  Users,
  Percent,
  TrendingUp,
  Wallet,
  UserCheck,
} from "lucide-react";
import {
  arrData,
  clientsData,
  grossMarginData,
  netIncomeData,
  employeesData,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  `R$ ${(value / 1000).toFixed(0)}K`;

const formatCurrencyFull = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR")}`;

const Index = () => {
  // Current values (last month)
  const currentARR = arrData[arrData.length - 1].value;
  const currentClients = clientsData[clientsData.length - 1].value;
  const currentGrossMargin = grossMarginData[grossMarginData.length - 1].value;
  const currentNetIncome = netIncomeData[netIncomeData.length - 1].value;
  const currentEmployees = employeesData[employeesData.length - 1].value;
  const revenuePerEmployee = Math.round(currentARR / currentEmployees);

  // Previous values for trends
  const prevARR = arrData[arrData.length - 2].value;
  const prevClients = clientsData[clientsData.length - 2].value;
  const prevGrossMargin = grossMarginData[grossMarginData.length - 2].value;

  return (
    <DashboardLayout title="Visão Geral da Empresa">
      <div className="space-y-6 animate-fade-in">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ARR"
            value={formatCurrencyFull(currentARR)}
            trend={{ value: Number((((currentARR - prevARR) / prevARR) * 100).toFixed(1)), label: "vs mês anterior" }}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Nº de Clientes"
            value={currentClients}
            trend={{ value: Number((((currentClients - prevClients) / prevClients) * 100).toFixed(1)), label: "vs mês anterior" }}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Gross Margin"
            value={`${currentGrossMargin}%`}
            trend={{ value: currentGrossMargin - prevGrossMargin, label: "vs mês anterior" }}
            icon={<Percent className="h-5 w-5" />}
          />
          <StatCard
            title="Net Income"
            value={formatCurrencyFull(currentNetIncome)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Cash Flow & Employees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Cash Flow - Início do Período"
            value={formatCurrencyFull(2500000)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Cash Flow - Fim do Período"
            value={formatCurrencyFull(2850000)}
            trend={{ value: 14, label: "crescimento" }}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Nº Colaboradores"
            value={currentEmployees}
            subtitle={`Revenue/Employee: ${formatCurrencyFull(revenuePerEmployee)}`}
            icon={<UserCheck className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
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
              color="hsl(var(--chart-2))"
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Gross Margin (%)" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={grossMarginData}
              formatValue={(v) => `${v}%`}
              color="hsl(var(--chart-3))"
            />
          </ChartCard>
          <ChartCard title="Net Income" subtitle="Evolução mensal">
            <MonthlyLineChart
              data={netIncomeData}
              formatValue={formatCurrency}
              color="hsl(var(--chart-4))"
            />
          </ChartCard>
        </div>

        <ChartCard title="Nº de Colaboradores" subtitle="Evolução mensal">
          <MonthlyLineChart
            data={employeesData}
            color="hsl(var(--chart-5))"
          />
        </ChartCard>
      </div>
    </DashboardLayout>
  );
};

export default Index;
