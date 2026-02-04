import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
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

// Historical data by time period
const metricsData = {
  day: {
    conversions: [
      { name: "Seg", value: 18 }, { name: "Ter", value: 22 }, { name: "Qua", value: 25 },
      { name: "Qui", value: 20 }, { name: "Sex", value: 28 }, { name: "Sáb", value: 12 }, { name: "Dom", value: 8 }
    ],
    opportunitiesCreated: [
      { name: "Seg", value: 4 }, { name: "Ter", value: 6 }, { name: "Qua", value: 5 },
      { name: "Qui", value: 7 }, { name: "Sex", value: 8 }, { name: "Sáb", value: 2 }, { name: "Dom", value: 0 }
    ],
    opportunitiesOpen: [
      { name: "Seg", value: 42 }, { name: "Ter", value: 44 }, { name: "Qua", value: 45 },
      { name: "Qui", value: 43 }, { name: "Sex", value: 47 }, { name: "Sáb", value: 47 }, { name: "Dom", value: 47 }
    ],
    pipelineGenerated: [
      { name: "Seg", value: 120000 }, { name: "Ter", value: 180000 }, { name: "Qua", value: 95000 },
      { name: "Qui", value: 210000 }, { name: "Sex", value: 245000 }, { name: "Sáb", value: 0 }, { name: "Dom", value: 0 }
    ],
    pipelineTotal: [
      { name: "Seg", value: 1950000 }, { name: "Ter", value: 2010000 }, { name: "Qua", value: 2050000 },
      { name: "Qui", value: 2080000 }, { name: "Sex", value: 2150000 }, { name: "Sáb", value: 2150000 }, { name: "Dom", value: 2150000 }
    ]
  },
  week: {
    conversions: [
      { name: "Sem 1", value: 32 }, { name: "Sem 2", value: 38 }, { name: "Sem 3", value: 42 },
      { name: "Sem 4", value: 44 }
    ],
    opportunitiesCreated: [
      { name: "Sem 1", value: 6 }, { name: "Sem 2", value: 8 }, { name: "Sem 3", value: 9 },
      { name: "Sem 4", value: 9 }
    ],
    opportunitiesOpen: [
      { name: "Sem 1", value: 38 }, { name: "Sem 2", value: 42 }, { name: "Sem 3", value: 45 },
      { name: "Sem 4", value: 47 }
    ],
    pipelineGenerated: [
      { name: "Sem 1", value: 180000 }, { name: "Sem 2", value: 220000 }, { name: "Sem 3", value: 210000 },
      { name: "Sem 4", value: 240000 }
    ],
    pipelineTotal: [
      { name: "Sem 1", value: 1780000 }, { name: "Sem 2", value: 1920000 }, { name: "Sem 3", value: 2010000 },
      { name: "Sem 4", value: 2150000 }
    ]
  },
  month: {
    conversions: [
      { name: "Jul", value: 120 }, { name: "Ago", value: 135 }, { name: "Set", value: 128 },
      { name: "Out", value: 142 }, { name: "Nov", value: 145 }, { name: "Dez", value: 156 }
    ],
    opportunitiesCreated: [
      { name: "Jul", value: 22 }, { name: "Ago", value: 28 }, { name: "Set", value: 25 },
      { name: "Out", value: 30 }, { name: "Nov", value: 27 }, { name: "Dez", value: 32 }
    ],
    opportunitiesOpen: [
      { name: "Jul", value: 38 }, { name: "Ago", value: 42 }, { name: "Set", value: 45 },
      { name: "Out", value: 40 }, { name: "Nov", value: 44 }, { name: "Dez", value: 47 }
    ],
    pipelineGenerated: [
      { name: "Jul", value: 620000 }, { name: "Ago", value: 710000 }, { name: "Set", value: 680000 },
      { name: "Out", value: 750000 }, { name: "Nov", value: 820000 }, { name: "Dez", value: 850000 }
    ],
    pipelineTotal: [
      { name: "Jul", value: 1650000 }, { name: "Ago", value: 1780000 }, { name: "Set", value: 1850000 },
      { name: "Out", value: 1920000 }, { name: "Nov", value: 2080000 }, { name: "Dez", value: 2150000 }
    ]
  },
  quarter: {
    conversions: [
      { name: "Q1 2025", value: 380 }, { name: "Q2 2025", value: 420 }, { name: "Q3 2025", value: 405 },
      { name: "Q4 2025", value: 443 }
    ],
    opportunitiesCreated: [
      { name: "Q1 2025", value: 68 }, { name: "Q2 2025", value: 82 }, { name: "Q3 2025", value: 75 },
      { name: "Q4 2025", value: 89 }
    ],
    opportunitiesOpen: [
      { name: "Q1 2025", value: 35 }, { name: "Q2 2025", value: 38 }, { name: "Q3 2025", value: 42 },
      { name: "Q4 2025", value: 47 }
    ],
    pipelineGenerated: [
      { name: "Q1 2025", value: 1850000 }, { name: "Q2 2025", value: 2100000 }, { name: "Q3 2025", value: 2010000 },
      { name: "Q4 2025", value: 2420000 }
    ],
    pipelineTotal: [
      { name: "Q1 2025", value: 1420000 }, { name: "Q2 2025", value: 1650000 }, { name: "Q3 2025", value: 1850000 },
      { name: "Q4 2025", value: 2150000 }
    ]
  }
};

interface MetricChartCardProps {
  title: string;
  data: { name: string; value: number }[];
  formatValue?: (value: number) => string;
  color?: string;
  currentValue: string;
  trend?: { value: number };
}

const MetricChartCard = ({ title, data, formatValue, color = "hsl(var(--primary))", currentValue, trend }: MetricChartCardProps) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
        {trend && (
          <span className="text-xs text-muted-foreground">
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold mb-3">{currentValue}</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [formatValue ? formatValue(value) : value, '']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="value" 
              fill={color} 
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Growth = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [timePeriod, setTimePeriod] = useState<PeriodFilter>("last_3_months");
  const [selectedMonth, setSelectedMonth] = useState<typeof forecastByMonth[0] | null>(null);

  const totalCommit = forecastByMonth.reduce((sum, m) => sum + m.commit, 0);
  const totalBestCase = forecastByMonth.reduce((sum, m) => sum + m.bestCase, 0);
  
  const currentData = metricsData[timeFilter];

  const handleBarClick = (data: any) => {
    if (data && data.activePayload) {
      const monthData = forecastByMonth.find(m => m.name === data.activeLabel);
      if (monthData) {
        setSelectedMonth(monthData);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-foreground">Pipeline</h1>
          <FilterButtons value={timeFilter} onChange={setTimeFilter} periodValue={timePeriod} onPeriodChange={setTimePeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricChartCard
            title="Conversões Forms"
            data={currentData.conversions}
            currentValue="156"
            color="hsl(200 70% 50%)"
          />
          <MetricChartCard
            title="Ops Abertas"
            data={currentData.opportunitiesOpen}
            currentValue="47"
            color="hsl(38 92% 50%)"
          />
          <MetricChartCard
            title="Pipeline Gerado (R$)"
            data={currentData.pipelineGenerated}
            formatValue={(v) => `R$ ${formatCurrency(v)}`}
            currentValue={formatCurrency(850000)}
            color="hsl(280 70% 55%)"
          />
          <MetricChartCard
            title="Pipeline Total (R$)"
            data={currentData.pipelineTotal}
            formatValue={(v) => `R$ ${formatCurrency(v)}`}
            currentValue={formatCurrency(2150000)}
            color="hsl(var(--primary))"
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