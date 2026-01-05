import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Calendar, Headphones, MessageSquare, Activity } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Clientes"
            value={totalClients}
            trend={{ value: 7 }}
          />
          <StatCard
            title="Por Produto"
            value={customersByProduct.length + " produtos"}
          />
          <StatCard
            title="Por Plano"
            value={customersByPlan.length + " planos"}
          />
          <StatCard
            title="Por CS"
            value={customersByCS.length + " CSs"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Clientes por Produto">
            <SimpleBarChart
              data={customersByProduct}
              color="hsl(0 0% 65%)"
              height={220}
            />
          </ChartCard>
          <ChartCard title="Clientes por Plano">
            <SimpleBarChart
              data={customersByPlan}
              color="hsl(0 0% 55%)"
              height={220}
            />
          </ChartCard>
          <ChartCard title="Clientes por CS">
            <SimpleBarChart
              data={customersByCS}
              color="hsl(0 0% 50%)"
              height={220}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="$ por Plano">
            <HorizontalBarChart
              data={customersByPlan.map(p => ({ name: p.name, value: p.amount }))}
              formatValue={formatCurrency}
              color="hsl(0 0% 60%)"
              height={200}
            />
          </ChartCard>
          <ChartCard title="$ por CS">
            <HorizontalBarChart
              data={customersByCS.map(c => ({ name: c.name, value: c.amount }))}
              formatValue={formatCurrency}
              color="hsl(0 0% 55%)"
              height={200}
            />
          </ChartCard>
        </div>

        {/* Renewals Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Renovações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Próximos 30 dias">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="text-xl font-normal">{renewals.next30.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Valor</span>
                  <span className="text-lg font-normal">{formatCurrency(renewals.next30.value)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary rounded">
                    <p className="text-xl font-normal">{renewals.next30.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em tratativa</p>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded">
                    <p className="text-xl font-normal">{renewals.next30.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Não iniciado</p>
                  </div>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Próximos 90 dias">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="text-xl font-normal">{renewals.next90.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Valor</span>
                  <span className="text-lg font-normal">{formatCurrency(renewals.next90.value)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary rounded">
                    <p className="text-xl font-normal">{renewals.next90.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em tratativa</p>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded">
                    <p className="text-xl font-normal">{renewals.next90.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Não iniciado</p>
                  </div>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Próximos 180 dias">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="text-xl font-normal">{renewals.next180.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Valor</span>
                  <span className="text-lg font-normal">{formatCurrency(renewals.next180.value)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary rounded">
                    <p className="text-xl font-normal">{renewals.next180.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em tratativa</p>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded">
                    <p className="text-xl font-normal">{renewals.next180.notStarted}</p>
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
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
            />
            <StatCard
              title="Média por Cliente"
              value="2.4"
            />
            <StatCard
              title="Média por CS"
              value="48.3"
            />
          </div>
        </div>

        {/* Usage Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Utilização (Geral)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Comunicados Enviados"
              value="45.200"
              trend={{ value: 15 }}
            />
            <StatCard title="% E-mail" value="45%" />
            <StatCard title="% Teams" value="35%" />
            <StatCard title="% WhatsApp" value="20%" />
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
            <Headphones className="h-4 w-4 text-muted-foreground" />
            Suporte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Chamados Abertos">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.opened.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.opened.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.opened.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Chamados Fechados">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.closed.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.closed.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.closed.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Backlog">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.backlog.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.backlog.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{supportTickets.backlog.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Volume por Tipo de Chamado">
            <HorizontalBarChart
              data={ticketsByType}
              color="hsl(0 0% 60%)"
              height={300}
            />
          </ChartCard>
          <ChartCard title="Chamados por Cliente">
            <HorizontalBarChart
              data={ticketsByCustomer}
              color="hsl(0 0% 55%)"
              height={300}
            />
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
