import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import {
  Users,
  Package,
  CreditCard,
  UserCheck,
  Calendar,
  Headphones,
  MessageSquare,
  Activity,
} from "lucide-react";
import {
  customersByProduct,
  customersByPlan,
  customersByCS,
  renewals,
  supportTickets,
  ticketsByType,
  ticketsByCustomer,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR")}`;

const Customers = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  const totalClients = 60;

  return (
    <DashboardLayout title="Clientes">
      <div className="space-y-6 animate-fade-in">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Clientes"
            value={totalClients}
            trend={{ value: 7 }}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Por Produto"
            value={customersByProduct.length + " produtos"}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Por Plano"
            value={customersByPlan.length + " planos"}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Por CS"
            value={customersByCS.length + " CSs"}
            icon={<UserCheck className="h-5 w-5" />}
          />
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Clientes por Produto">
            <SimpleBarChart
              data={customersByProduct}
              color="hsl(var(--chart-1))"
              height={220}
            />
          </ChartCard>
          <ChartCard title="Clientes por Plano">
            <SimpleBarChart
              data={customersByPlan}
              color="hsl(var(--chart-2))"
              height={220}
            />
          </ChartCard>
          <ChartCard title="Clientes por CS">
            <SimpleBarChart
              data={customersByCS}
              color="hsl(var(--chart-3))"
              height={220}
            />
          </ChartCard>
        </div>

        {/* Revenue by Plan and CS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="$ por Plano">
            <HorizontalBarChart
              data={customersByPlan.map(p => ({ name: p.name, value: p.amount }))}
              formatValue={formatCurrency}
              color="hsl(var(--chart-2))"
              height={200}
            />
          </ChartCard>
          <ChartCard title="$ por CS">
            <HorizontalBarChart
              data={customersByCS.map(c => ({ name: c.name, value: c.amount }))}
              formatValue={formatCurrency}
              color="hsl(var(--chart-3))"
              height={200}
            />
          </ChartCard>
        </div>

        {/* Renewals Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Renovações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Próximos 30 dias">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">{renewals.next30.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(renewals.next30.value)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">{renewals.next30.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em tratativa</p>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{renewals.next30.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Não iniciado</p>
                  </div>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Próximos 90 dias">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">{renewals.next90.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(renewals.next90.value)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">{renewals.next90.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em tratativa</p>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{renewals.next90.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Não iniciado</p>
                  </div>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Próximos 180 dias">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">{renewals.next180.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(renewals.next180.value)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">{renewals.next180.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em tratativa</p>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{renewals.next180.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Não iniciado</p>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Relationship Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Relacionamento
          </h2>
          <div className="flex justify-end mb-4">
            <FilterButtons value={timeFilter} onChange={setTimeFilter} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Reuniões Feitas"
              value="145"
              trend={{ value: 12 }}
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <StatCard
              title="Média por Cliente"
              value="2.4"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Média por CS"
              value="48.3"
              icon={<UserCheck className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Usage Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Utilização (Geral)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Comunicados Enviados"
              value="45.200"
              trend={{ value: 15 }}
            />
            <StatCard
              title="% E-mail"
              value="45%"
            />
            <StatCard
              title="% Teams"
              value="35%"
            />
            <StatCard
              title="% WhatsApp"
              value="20%"
            />
            <StatCard
              title="Disparos Totais"
              value="128.500"
              trend={{ value: 8 }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <StatCard
              title="Usuários na Base"
              value="156.000"
              trend={{ value: 5 }}
            />
            <StatCard
              title="Colaboradores Cadastrados"
              value="98.500"
              trend={{ value: 3 }}
            />
          </div>
        </div>

        {/* Support Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            Suporte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Chamados Abertos">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{supportTickets.opened.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{supportTickets.opened.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{supportTickets.opened.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Chamados Fechados">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">{supportTickets.closed.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">{supportTickets.closed.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">{supportTickets.closed.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Backlog">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{supportTickets.backlog.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{supportTickets.backlog.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{supportTickets.backlog.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Support Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Volume por Tipo de Chamado">
            <HorizontalBarChart
              data={ticketsByType}
              color="hsl(var(--chart-2))"
              height={300}
            />
          </ChartCard>
          <ChartCard title="Chamados por Cliente">
            <HorizontalBarChart
              data={ticketsByCustomer}
              color="hsl(var(--chart-coral))"
              height={300}
            />
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
