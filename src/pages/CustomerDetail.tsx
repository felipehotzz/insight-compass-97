import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { CustomerSelector } from "@/components/dashboard/CustomerSelector";
import { ContactTooltip } from "@/components/dashboard/ContactTooltip";
import { ChannelBreakdownChart, generateChannelData, generateDispatchData } from "@/components/charts/ChannelBreakdownChart";
import { SupportBreakdownChart, generateOpenedTicketsData, generateClosedTicketsData, generateBacklogData } from "@/components/charts/SupportBreakdownChart";
import { SimpleLineChart, generateUsersData, generateCollaboratorsData } from "@/components/charts/SimpleLineChart";
import { ActionBreakdownChart, generateActionsData } from "@/components/charts/ActionBreakdownChart";
import {
  Mail,
  Phone,
  Linkedin,
  Video,
  ExternalLink,
  Plus,
} from "lucide-react";
import { customerDetail } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR");

const CustomerDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [usageFilter, setUsageFilter] = useState<TimeFilter>("month");
  const [supportFilter, setSupportFilter] = useState<TimeFilter>("month");

  const customerName = searchParams.get("name") || customerDetail.name;
  const customer = customerDetail;

  const handleRegisterAction = () => {
    navigate(`/actions/new?customer=${encodeURIComponent(customerName)}`);
  };

  return (
    <DashboardLayout title={<CustomerSelector currentCustomerName={customerName} />}>
      <div className="space-y-6 animate-fade-in">
        {/* Action button */}
        <div className="flex justify-end">
          <Button onClick={handleRegisterAction}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Ação
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="R$ Contrato"
            value={formatCurrency(customer.contractValue)}
          />
          <StatCard
            title="LTV Total (R$)"
            value={formatCurrency(customer.ltv)}
          />
          <StatCard
            title="Tempo Ativo"
            value={`${customer.monthsAsCustomer} meses`}
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

        {/* CS Responsible & Champions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CS Responsible */}
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

          {/* Champions */}
          <div className="glass-card p-5">
            <h2 className="section-title mb-3">Champions (Contatos)</h2>
            <div className="divide-y divide-border">
              {customer.champions.map((champion, index) => (
                <div key={index} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{champion.name}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <ContactTooltip
                        icon={<Mail className="h-3.5 w-3.5" />}
                        value={champion.email}
                        href={`mailto:${champion.email}`}
                      />
                      <ContactTooltip
                        icon={<Phone className="h-3.5 w-3.5" />}
                        value={champion.phone}
                        href={`tel:${champion.phone}`}
                      />
                      <ContactTooltip
                        icon={<Linkedin className="h-3.5 w-3.5" />}
                        value={champion.linkedin}
                        href={`https://${champion.linkedin}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Relationship Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Relacionamento</h2>
            <FilterButtons value={timeFilter} onChange={setTimeFilter} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Ações Feitas" subtitle="Por tipo de ação">
              <ActionBreakdownChart data={generateActionsData(timeFilter)} />
            </ChartCard>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registro de Ações</h3>
                <a href="/actions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Ver todos →
                </a>
              </div>
              <div className="divide-y divide-border">
                {customer.meetings.map((meeting, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded transition-colors"
                    onClick={() => navigate(`/actions/new?edit=${index + 1}`)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{meeting.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{meeting.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Usuários na Base" subtitle="Evolução ao longo do tempo">
              <SimpleLineChart data={generateUsersData(usageFilter)} />
            </ChartCard>
            <ChartCard title="Colaboradores Cadastrados" subtitle="Evolução ao longo do tempo">
              <SimpleLineChart data={generateCollaboratorsData(usageFilter)} />
            </ChartCard>
          </div>
        </div>

        {/* Support Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Suporte</h2>
            <FilterButtons value={supportFilter} onChange={setSupportFilter} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Chamados Abertos" subtitle="Por nível">
              <SupportBreakdownChart data={generateOpenedTicketsData(supportFilter)} />
            </ChartCard>
            <ChartCard title="Chamados Fechados" subtitle="Por nível">
              <SupportBreakdownChart data={generateClosedTicketsData(supportFilter)} />
            </ChartCard>
            <ChartCard title="Backlog" subtitle="Por nível">
              <SupportBreakdownChart data={generateBacklogData(supportFilter)} />
            </ChartCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetail;
