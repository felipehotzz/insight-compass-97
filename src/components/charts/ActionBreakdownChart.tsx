import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionData {
  period: string;
  reuniao: number;
  email: number;
  ligacao: number;
  whatsapp: number;
  total: number;
}

interface ActionBreakdownChartProps {
  data: ActionData[];
  height?: number;
}

const legendItems = [
  { name: "Reunião", color: "hsl(0 0% 70%)" },
  { name: "E-mail", color: "hsl(0 0% 55%)" },
  { name: "Ligação", color: "hsl(0 0% 45%)" },
  { name: "WhatsApp", color: "hsl(0 0% 35%)" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <p className="text-lg font-medium mb-2">Total: {total.toLocaleString("pt-BR")}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const percentage = ((entry.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{entry.value.toLocaleString("pt-BR")}</span>
                  <span className="text-muted-foreground">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = () => {
  const maxVisible = 3;
  const visibleItems = legendItems.slice(0, maxVisible);
  const hiddenItems = legendItems.slice(maxVisible);
  const hiddenCount = hiddenItems.length;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-4 text-[11px]">
      {visibleItems.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div 
            className="w-2 h-2 rounded-sm" 
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.name}</span>
        </div>
      ))}
      {hiddenCount > 0 && (
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/50 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-2">
              <div className="flex flex-col gap-1">
                {hiddenItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export function ActionBreakdownChart({ data, height = 280 }: ActionBreakdownChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="period"
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
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          <Bar 
            dataKey="reuniao" 
            name="Reunião" 
            stackId="a" 
            fill="hsl(0 0% 70%)" 
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="email" 
            name="E-mail" 
            stackId="a" 
            fill="hsl(0 0% 55%)" 
          />
          <Bar 
            dataKey="ligacao" 
            name="Ligação" 
            stackId="a" 
            fill="hsl(0 0% 45%)" 
          />
          <Bar 
            dataKey="whatsapp" 
            name="WhatsApp" 
            stackId="a" 
            fill="hsl(0 0% 35%)" 
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}

export function generateActionsData(filter: string): ActionData[] {
  const baseData: Record<string, ActionData[]> = {
    day: [
      { period: "Seg", reuniao: 2, email: 3, ligacao: 1, whatsapp: 2, total: 8 },
      { period: "Ter", reuniao: 3, email: 2, ligacao: 2, whatsapp: 1, total: 8 },
      { period: "Qua", reuniao: 1, email: 4, ligacao: 1, whatsapp: 3, total: 9 },
      { period: "Qui", reuniao: 2, email: 3, ligacao: 2, whatsapp: 2, total: 9 },
      { period: "Sex", reuniao: 4, email: 2, ligacao: 1, whatsapp: 1, total: 8 },
    ],
    week: [
      { period: "Sem 1", reuniao: 8, email: 12, ligacao: 5, whatsapp: 7, total: 32 },
      { period: "Sem 2", reuniao: 10, email: 14, ligacao: 6, whatsapp: 8, total: 38 },
      { period: "Sem 3", reuniao: 9, email: 11, ligacao: 4, whatsapp: 6, total: 30 },
      { period: "Sem 4", reuniao: 12, email: 15, ligacao: 7, whatsapp: 9, total: 43 },
    ],
    month: [
      { period: "Jul", reuniao: 28, email: 42, ligacao: 18, whatsapp: 24, total: 112 },
      { period: "Ago", reuniao: 32, email: 48, ligacao: 20, whatsapp: 28, total: 128 },
      { period: "Set", reuniao: 30, email: 45, ligacao: 16, whatsapp: 22, total: 113 },
      { period: "Out", reuniao: 35, email: 52, ligacao: 22, whatsapp: 30, total: 139 },
      { period: "Nov", reuniao: 38, email: 55, ligacao: 24, whatsapp: 32, total: 149 },
      { period: "Dez", reuniao: 40, email: 58, ligacao: 26, whatsapp: 35, total: 159 },
    ],
    quarter: [
      { period: "Q1", reuniao: 85, email: 130, ligacao: 52, whatsapp: 70, total: 337 },
      { period: "Q2", reuniao: 95, email: 145, ligacao: 58, whatsapp: 78, total: 376 },
      { period: "Q3", reuniao: 105, email: 155, ligacao: 62, whatsapp: 85, total: 407 },
      { period: "Q4", reuniao: 115, email: 168, ligacao: 70, whatsapp: 95, total: 448 },
    ],
  };

  return baseData[filter] || baseData.month;
}

// Global data (all customers aggregated)
export function generateGlobalActionsData(filter: string): ActionData[] {
  const baseData: Record<string, ActionData[]> = {
    day: [
      { period: "Seg", reuniao: 18, email: 32, ligacao: 12, whatsapp: 22, total: 84 },
      { period: "Ter", reuniao: 24, email: 28, ligacao: 15, whatsapp: 18, total: 85 },
      { period: "Qua", reuniao: 15, email: 35, ligacao: 10, whatsapp: 25, total: 85 },
      { period: "Qui", reuniao: 22, email: 30, ligacao: 18, whatsapp: 20, total: 90 },
      { period: "Sex", reuniao: 28, email: 25, ligacao: 12, whatsapp: 15, total: 80 },
    ],
    week: [
      { period: "Sem 1", reuniao: 72, email: 108, ligacao: 45, whatsapp: 63, total: 288 },
      { period: "Sem 2", reuniao: 85, email: 120, ligacao: 52, whatsapp: 70, total: 327 },
      { period: "Sem 3", reuniao: 78, email: 98, ligacao: 38, whatsapp: 55, total: 269 },
      { period: "Sem 4", reuniao: 95, email: 128, ligacao: 58, whatsapp: 78, total: 359 },
    ],
    month: [
      { period: "Jul", reuniao: 245, email: 380, ligacao: 162, whatsapp: 215, total: 1002 },
      { period: "Ago", reuniao: 280, email: 420, ligacao: 175, whatsapp: 245, total: 1120 },
      { period: "Set", reuniao: 265, email: 395, ligacao: 145, whatsapp: 198, total: 1003 },
      { period: "Out", reuniao: 305, email: 455, ligacao: 195, whatsapp: 265, total: 1220 },
      { period: "Nov", reuniao: 335, email: 485, ligacao: 212, whatsapp: 285, total: 1317 },
      { period: "Dez", reuniao: 355, email: 510, ligacao: 230, whatsapp: 310, total: 1405 },
    ],
    quarter: [
      { period: "Q1", reuniao: 750, email: 1150, ligacao: 460, whatsapp: 620, total: 2980 },
      { period: "Q2", reuniao: 840, email: 1280, ligacao: 515, whatsapp: 690, total: 3325 },
      { period: "Q3", reuniao: 925, email: 1370, ligacao: 550, whatsapp: 755, total: 3600 },
      { period: "Q4", reuniao: 1015, email: 1485, ligacao: 620, whatsapp: 840, total: 3960 },
    ],
  };

  return baseData[filter] || baseData.month;
}
