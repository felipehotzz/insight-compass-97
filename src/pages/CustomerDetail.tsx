import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { CustomerSelector } from "@/components/dashboard/CustomerSelector";
import { ChannelBreakdownChart, generateChannelData, generateDispatchData } from "@/components/charts/ChannelBreakdownChart";
import {
  Mail,
  Phone,
  Linkedin,
  Video,
  ExternalLink,
} from "lucide-react";
import { customerDetail } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR");

const CustomerDetail = () => {
  const [searchParams] = useSearchParams();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [usageFilter, setUsageFilter] = useState<TimeFilter>("month");

  const customerName = searchParams.get("name") || customerDetail.name;
  const customer = customerDetail;

  return (
    <DashboardLayout title={<CustomerSelector currentCustomerName={customerName} />}>
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Valor do Contrato (R$)"
            value={formatCurrency(customer.contractValue)}
          />
          <StatCard
            title="Tempo como Cliente"
            value={`${customer.monthsAsCustomer} meses`}
          />
          <StatCard
            title="LTV Total (R$)"
            value={formatCurrency(customer.ltv)}
          />
          <StatCard
            title="Plano Atual"
            value={customer.currentPlan}
          />
          <StatCard
            title="Meses Restantes"
            value={customer.remainingMonths}
          />
        </div>

        {/* CS Responsible Section */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-3">CS Responsável</h2>
          <div className="flex items-center justify-between py-1">
            <span className="font-medium">{customer.csResponsible.name}</span>
            <a href={`mailto:${customer.csResponsible.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5" />
              <span>{customer.csResponsible.email}</span>
            </a>
          </div>
        </div>

        {/* Champions Section */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-3">Champions (Contatos)</h2>
          <div className="divide-y divide-border">
            {customer.champions.map((champion, index) => (
              <div key={index} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{champion.name}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <a href={`mailto:${champion.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden lg:inline">{champion.email}</span>
                    </a>
                    <a href={`tel:${champion.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="hidden lg:inline">{champion.phone}</span>
                    </a>
                    <a href={`https://${champion.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Section */}
        <div>
          <h2 className="section-title mb-4">Relacionamento</h2>
          <div className="flex justify-end mb-4">
            <FilterButtons value={timeFilter} onChange={setTimeFilter} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <StatCard
              title="Reuniões Feitas"
              value="12"
              trend={{ value: 20 }}
            />
            <StatCard
              title="E-mails Proativos"
              value="28"
            />
          </div>

          <ChartCard title="Registro de Reuniões">
            <div className="space-y-4">
              {customer.meetings.map((meeting, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-secondary/50 rounded">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <span className="text-sm text-muted-foreground">{meeting.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{meeting.notes}</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground hover:text-foreground" asChild>
                      <a href={meeting.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver gravação
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Usage Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Utilização</h2>
            <FilterButtons value={usageFilter} onChange={setUsageFilter} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <ChartCard title="Comunicados Enviados" subtitle="Por canal">
              <ChannelBreakdownChart data={generateChannelData(usageFilter)} />
            </ChartCard>
            <ChartCard title="Disparos Totais" subtitle="Por canal">
              <ChannelBreakdownChart data={generateDispatchData(usageFilter)} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Usuários na Base"
              value={customer.usage.usersInBase.toLocaleString("pt-BR")}
              trend={{ value: 5 }}
            />
            <StatCard
              title="Colaboradores Cadastrados"
              value={customer.usage.registeredCollaborators.toLocaleString("pt-BR")}
              trend={{ value: 3 }}
            />
          </div>
        </div>

        {/* Support Section */}
        <div>
          <h2 className="section-title mb-4">Suporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Chamados Abertos">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.opened.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.opened.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.opened.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Chamados Fechados">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.closed.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.closed.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.closed.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Backlog">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.backlog.n1}</p>
                  <p className="text-xs text-muted-foreground">N1</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.backlog.n2}</p>
                  <p className="text-xs text-muted-foreground">N2</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded">
                  <p className="text-xl font-normal">{customer.support.backlog.n3}</p>
                  <p className="text-xs text-muted-foreground">N3</p>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetail;
