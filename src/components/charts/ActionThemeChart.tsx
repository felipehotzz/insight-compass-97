import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionThemeData {
  period: string;
  renovacao: number;
  expansao: number;
  onboarding: number;
  contencao: number;
  suporte: number;
  tecnica: number;
  relacionamento: number;
  total: number;
}

interface ActionThemeChartProps {
  data: ActionThemeData[];
  height?: number;
}

const legendItems = [
  { name: "Renovação", color: "hsl(142 71% 45%)" },
  { name: "Expansão", color: "hsl(200 70% 50%)" },
  { name: "Onboarding", color: "hsl(280 60% 55%)" },
  { name: "Contenção", color: "hsl(0 70% 55%)" },
  { name: "Suporte", color: "hsl(40 80% 50%)" },
  { name: "Técnica", color: "hsl(0 0% 50%)" },
  { name: "Relacionamento", color: "hsl(320 60% 55%)" },
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
          <span style={{ color: item.color }}>{item.name}</span>
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
                    <span style={{ color: item.color }}>{item.name}</span>
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

export function ActionThemeChart({ data, height = 280 }: ActionThemeChartProps) {
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
            dataKey="renovacao" 
            name="Renovação" 
            stackId="a" 
            fill="hsl(142 71% 45%)" 
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="expansao" 
            name="Expansão" 
            stackId="a" 
            fill="hsl(200 70% 50%)" 
          />
          <Bar 
            dataKey="onboarding" 
            name="Onboarding" 
            stackId="a" 
            fill="hsl(280 60% 55%)" 
          />
          <Bar 
            dataKey="contencao" 
            name="Contenção" 
            stackId="a" 
            fill="hsl(0 70% 55%)" 
          />
          <Bar 
            dataKey="suporte" 
            name="Suporte" 
            stackId="a" 
            fill="hsl(40 80% 50%)" 
          />
          <Bar 
            dataKey="tecnica" 
            name="Técnica" 
            stackId="a" 
            fill="hsl(0 0% 50%)" 
          />
          <Bar 
            dataKey="relacionamento" 
            name="Relacionamento" 
            stackId="a" 
            fill="hsl(320 60% 55%)" 
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}

export function generateActionsThemeData(filter: string): ActionThemeData[] {
  const baseData: Record<string, ActionThemeData[]> = {
    day: [
      { period: "Seg", renovacao: 1, expansao: 1, onboarding: 2, contencao: 0, suporte: 2, tecnica: 1, relacionamento: 1, total: 8 },
      { period: "Ter", renovacao: 2, expansao: 0, onboarding: 1, contencao: 1, suporte: 1, tecnica: 2, relacionamento: 1, total: 8 },
      { period: "Qua", renovacao: 0, expansao: 2, onboarding: 2, contencao: 1, suporte: 2, tecnica: 1, relacionamento: 1, total: 9 },
      { period: "Qui", renovacao: 1, expansao: 1, onboarding: 1, contencao: 2, suporte: 2, tecnica: 1, relacionamento: 1, total: 9 },
      { period: "Sex", renovacao: 2, expansao: 1, onboarding: 1, contencao: 0, suporte: 1, tecnica: 1, relacionamento: 2, total: 8 },
    ],
    week: [
      { period: "Sem 1", renovacao: 5, expansao: 4, onboarding: 8, contencao: 3, suporte: 6, tecnica: 4, relacionamento: 2, total: 32 },
      { period: "Sem 2", renovacao: 6, expansao: 5, onboarding: 9, contencao: 4, suporte: 7, tecnica: 4, relacionamento: 3, total: 38 },
      { period: "Sem 3", renovacao: 4, expansao: 4, onboarding: 7, contencao: 3, suporte: 5, tecnica: 4, relacionamento: 3, total: 30 },
      { period: "Sem 4", renovacao: 7, expansao: 6, onboarding: 10, contencao: 4, suporte: 8, tecnica: 5, relacionamento: 3, total: 43 },
    ],
    month: [
      { period: "Jul", renovacao: 15, expansao: 12, onboarding: 28, contencao: 10, suporte: 22, tecnica: 15, relacionamento: 10, total: 112 },
      { period: "Ago", renovacao: 18, expansao: 14, onboarding: 32, contencao: 12, suporte: 25, tecnica: 17, relacionamento: 10, total: 128 },
      { period: "Set", renovacao: 16, expansao: 12, onboarding: 28, contencao: 11, suporte: 22, tecnica: 14, relacionamento: 10, total: 113 },
      { period: "Out", renovacao: 20, expansao: 15, onboarding: 35, contencao: 13, suporte: 28, tecnica: 18, relacionamento: 10, total: 139 },
      { period: "Nov", renovacao: 22, expansao: 16, onboarding: 38, contencao: 14, suporte: 30, tecnica: 19, relacionamento: 10, total: 149 },
      { period: "Dez", renovacao: 24, expansao: 17, onboarding: 40, contencao: 15, suporte: 32, tecnica: 20, relacionamento: 11, total: 159 },
    ],
    quarter: [
      { period: "Q1", renovacao: 48, expansao: 38, onboarding: 85, contencao: 32, suporte: 68, tecnica: 42, relacionamento: 24, total: 337 },
      { period: "Q2", renovacao: 55, expansao: 42, onboarding: 95, contencao: 36, suporte: 75, tecnica: 48, relacionamento: 25, total: 376 },
      { period: "Q3", renovacao: 60, expansao: 46, onboarding: 102, contencao: 38, suporte: 82, tecnica: 52, relacionamento: 27, total: 407 },
      { period: "Q4", renovacao: 68, expansao: 50, onboarding: 112, contencao: 42, suporte: 90, tecnica: 58, relacionamento: 28, total: 448 },
    ],
  };

  return baseData[filter] || baseData.month;
}

// Global data (all customers aggregated)
export function generateGlobalActionsThemeData(filter: string): ActionThemeData[] {
  const baseData: Record<string, ActionThemeData[]> = {
    day: [
      { period: "Seg", renovacao: 12, expansao: 10, onboarding: 18, contencao: 5, suporte: 18, tecnica: 12, relacionamento: 9, total: 84 },
      { period: "Ter", renovacao: 15, expansao: 8, onboarding: 15, contencao: 8, suporte: 15, tecnica: 15, relacionamento: 9, total: 85 },
      { period: "Qua", renovacao: 8, expansao: 15, onboarding: 18, contencao: 10, suporte: 16, tecnica: 10, relacionamento: 8, total: 85 },
      { period: "Qui", renovacao: 12, expansao: 12, onboarding: 15, contencao: 12, suporte: 18, tecnica: 12, relacionamento: 9, total: 90 },
      { period: "Sex", renovacao: 15, expansao: 10, onboarding: 12, contencao: 5, suporte: 12, tecnica: 10, relacionamento: 16, total: 80 },
    ],
    week: [
      { period: "Sem 1", renovacao: 45, expansao: 36, onboarding: 72, contencao: 27, suporte: 54, tecnica: 36, relacionamento: 18, total: 288 },
      { period: "Sem 2", renovacao: 52, expansao: 42, onboarding: 82, contencao: 32, suporte: 60, tecnica: 38, relacionamento: 21, total: 327 },
      { period: "Sem 3", renovacao: 38, expansao: 35, onboarding: 68, contencao: 28, suporte: 48, tecnica: 32, relacionamento: 20, total: 269 },
      { period: "Sem 4", renovacao: 58, expansao: 48, onboarding: 90, contencao: 35, suporte: 68, tecnica: 40, relacionamento: 20, total: 359 },
    ],
    month: [
      { period: "Jul", renovacao: 135, expansao: 108, onboarding: 252, contencao: 90, suporte: 198, tecnica: 135, relacionamento: 84, total: 1002 },
      { period: "Ago", renovacao: 158, expansao: 125, onboarding: 285, contencao: 105, suporte: 225, tecnica: 150, relacionamento: 72, total: 1120 },
      { period: "Set", renovacao: 145, expansao: 110, onboarding: 255, contencao: 98, suporte: 200, tecnica: 128, relacionamento: 67, total: 1003 },
      { period: "Out", renovacao: 175, expansao: 135, onboarding: 315, contencao: 115, suporte: 252, tecnica: 162, relacionamento: 66, total: 1220 },
      { period: "Nov", renovacao: 195, expansao: 148, onboarding: 345, contencao: 125, suporte: 270, tecnica: 172, relacionamento: 62, total: 1317 },
      { period: "Dez", renovacao: 215, expansao: 158, onboarding: 365, contencao: 138, suporte: 290, tecnica: 180, relacionamento: 59, total: 1405 },
    ],
    quarter: [
      { period: "Q1", renovacao: 425, expansao: 340, onboarding: 755, contencao: 285, suporte: 608, tecnica: 375, relacionamento: 192, total: 2980 },
      { period: "Q2", renovacao: 485, expansao: 378, onboarding: 845, contencao: 320, suporte: 675, tecnica: 430, relacionamento: 192, total: 3325 },
      { period: "Q3", renovacao: 535, expansao: 415, onboarding: 920, contencao: 345, suporte: 740, tecnica: 472, relacionamento: 173, total: 3600 },
      { period: "Q4", renovacao: 605, expansao: 450, onboarding: 1008, contencao: 380, suporte: 815, tecnica: 525, relacionamento: 177, total: 3960 },
    ],
  };

  return baseData[filter] || baseData.month;
}
