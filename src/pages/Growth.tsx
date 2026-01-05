import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  funnelData,
  funnelValueData,
  opportunitiesByValue,
  lostReasons,
} from "@/data/mockData";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR");

// Forecast data with deals for each month (with individual values)
interface Deal {
  name: string;
  value: number;
}

interface ForecastMonth {
  name: string;
  pipeline: number;
  commit: number;
  bestCase: number;
  commitDeals: Deal[];
  bestCaseDeals: Deal[];
  pipelineDeals: Deal[];
}

const forecastByMonth: ForecastMonth[] = [
  { 
    name: "Jan 2026", 
    pipeline: 150000, 
    commit: 300000, 
    bestCase: 180000,
    commitDeals: [
      { name: "Grendene", value: 180000 },
      { name: "Syngenta", value: 120000 },
    ],
    bestCaseDeals: [
      { name: "Alpargatas", value: 96000 },
      { name: "Metro BH", value: 84000 },
    ],
    pipelineDeals: [
      { name: "Novo Cliente A", value: 80000 },
      { name: "Novo Cliente B", value: 70000 },
    ]
  },
  { 
    name: "Fev 2026", 
    pipeline: 120000, 
    commit: 127464, 
    bestCase: 96000,
    commitDeals: [
      { name: "CBMM", value: 127464 },
    ],
    bestCaseDeals: [
      { name: "SESC Nacional", value: 96000 },
    ],
    pipelineDeals: [
      { name: "Lead Qualificado", value: 120000 },
    ]
  },
  { 
    name: "Mar 2026", 
    pipeline: 200000, 
    commit: 0, 
    bestCase: 150000,
    commitDeals: [],
    bestCaseDeals: [
      { name: "Softplan", value: 90000 },
      { name: "Eucatex", value: 60000 },
    ],
    pipelineDeals: [
      { name: "Prospect X", value: 120000 },
      { name: "Prospect Y", value: 80000 },
    ]
  },
  { 
    name: "Abr 2026", 
    pipeline: 180000, 
    commit: 0, 
    bestCase: 120000,
    commitDeals: [],
    bestCaseDeals: [
      { name: "Caixa Consórcios", value: 120000 },
    ],
    pipelineDeals: [
      { name: "Empresa Z", value: 180000 },
    ]
  },
  { 
    name: "Mai 2026", 
    pipeline: 250000, 
    commit: 0, 
    bestCase: 80000,
    commitDeals: [],
    bestCaseDeals: [
      { name: "CJ do Brasil", value: 80000 },
    ],
    pipelineDeals: [
      { name: "Oportunidade 1", value: 150000 },
      { name: "Oportunidade 2", value: 100000 },
    ]
  },
  { 
    name: "Jun 2026", 
    pipeline: 300000, 
    commit: 0, 
    bestCase: 79900,
    commitDeals: [],
    bestCaseDeals: [
      { name: "Cliente Potencial", value: 79900 },
    ],
    pipelineDeals: [
      { name: "Lead Premium", value: 200000 },
      { name: "Lead Standard", value: 100000 },
    ]
  },
];

const ForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <p className="text-lg font-medium mb-2">Total: R$ {formatCurrency(total)}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span>R$ {formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          Clique para ver negociações
        </p>
      </div>
    );
  }
  return null;
};

const Growth = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [selectedMonth, setSelectedMonth] = useState<typeof forecastByMonth[0] | null>(null);

  const totalCommit = forecastByMonth.reduce((sum, m) => sum + m.commit, 0);
  const totalBestCase = forecastByMonth.reduce((sum, m) => sum + m.bestCase, 0);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload) {
      const monthData = forecastByMonth.find(m => m.name === data.activeLabel);
      if (monthData) {
        setSelectedMonth(monthData);
      }
    }
  };

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Growth</h1>
          <FilterButtons value={timeFilter} onChange={setTimeFilter} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Conversões Forms"
            value="156"
            trend={{ value: 12 }}
          />
          <StatCard
            title="Oportunidades Criadas"
            value="32"
            trend={{ value: 8 }}
          />
          <StatCard
            title="Oportunidades Abertas"
            value="47"
          />
          <StatCard
            title="Pipeline Gerado (R$)"
            value={formatCurrency(850000)}
            trend={{ value: 15 }}
          />
          <StatCard
            title="Pipeline Total (R$)"
            value={formatCurrency(2150000)}
          />
        </div>

        {/* Forecast Chart - Full Width */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Forecast por Mês</h3>
              <p className="text-sm text-muted-foreground">Clique em um mês para ver as negociações</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Commit Total:</span>
                <span className="font-semibold">R$ {formatCurrency(totalCommit)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Best Case Total:</span>
                <span className="font-semibold">R$ {formatCurrency(totalBestCase)}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart 
              data={forecastByMonth} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={handleBarClick}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
              />
              <Tooltip content={<ForecastTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Legend 
                wrapperStyle={{ paddingTop: 16, fontSize: 11 }}
                iconType="square"
                iconSize={8}
              />
              <Bar 
                dataKey="pipeline" 
                name="Pipeline" 
                stackId="a" 
                fill="hsl(0 0% 70%)" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="bestCase" 
                name="Best Case" 
                stackId="a" 
                fill="hsl(200 70% 50%)" 
              />
              <Bar 
                dataKey="commit" 
                name="Commit" 
                stackId="a" 
                fill="hsl(142 71% 45%)" 
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Negócios em Andamento por Fase" subtitle="Quantidade">
            <FunnelChart data={funnelData} />
          </ChartCard>
          <ChartCard title="Valor em Andamento por Fase (R$)">
            <FunnelChart
              data={funnelValueData}
              formatValue={formatCurrency}
            />
          </ChartCard>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold mb-4">Ranking de Oportunidades por Valor (R$)</h3>
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
              <span>#</span>
              <span>Cliente</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
              {opportunitiesByValue.map((item, index) => (
                <div 
                  key={item.name} 
                  className="grid grid-cols-3 gap-4 px-2 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-right">R$ {formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ChartCard title="Motivos de Perda" subtitle="Contagem de negócios">
          <SimpleBarChart
            data={lostReasons}
            color="hsl(0 0% 60%)"
            height={280}
          />
        </ChartCard>

        {/* Month Details Modal */}
        <Dialog open={!!selectedMonth} onOpenChange={() => setSelectedMonth(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Negociações - {selectedMonth?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedMonth?.commit && selectedMonth.commit > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-sm font-medium">Commit</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      R$ {formatCurrency(selectedMonth.commit)}
                    </span>
                  </div>
                  <div className="space-y-2 pl-5">
                    {selectedMonth.commitDeals.map((deal) => (
                      <div key={deal.name} className="flex items-center justify-between text-sm">
                        <span>{deal.name}</span>
                        <span className="text-emerald-500 font-medium">R$ {formatCurrency(deal.value)}</span>
                      </div>
                    ))}
                    {selectedMonth.commitDeals.length === 0 && (
                      <span className="text-sm text-muted-foreground">Nenhuma negociação</span>
                    )}
                  </div>
                </div>
              )}
              
              {selectedMonth?.bestCase && selectedMonth.bestCase > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-sm font-medium">Best Case</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      R$ {formatCurrency(selectedMonth.bestCase)}
                    </span>
                  </div>
                  <div className="space-y-2 pl-5">
                    {selectedMonth.bestCaseDeals.map((deal) => (
                      <div key={deal.name} className="flex items-center justify-between text-sm">
                        <span>{deal.name}</span>
                        <span className="text-blue-500 font-medium">R$ {formatCurrency(deal.value)}</span>
                      </div>
                    ))}
                    {selectedMonth.bestCaseDeals.length === 0 && (
                      <span className="text-sm text-muted-foreground">Nenhuma negociação</span>
                    )}
                  </div>
                </div>
              )}

              {selectedMonth?.pipeline && selectedMonth.pipeline > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <div className="w-3 h-3 rounded-sm bg-gray-400" />
                    <span className="text-sm font-medium">Pipeline</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      R$ {formatCurrency(selectedMonth.pipeline)}
                    </span>
                  </div>
                  <div className="space-y-2 pl-5">
                    {selectedMonth.pipelineDeals.map((deal) => (
                      <div key={deal.name} className="flex items-center justify-between text-sm">
                        <span>{deal.name}</span>
                        <span className="text-muted-foreground font-medium">R$ {formatCurrency(deal.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Growth;