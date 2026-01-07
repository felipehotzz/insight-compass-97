import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterButtons } from "@/components/dashboard/FilterButtons";
import type { TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
import { ChannelBreakdownChart, generateChannelData, generateDispatchData } from "@/components/charts/ChannelBreakdownChart";
import { SimpleLineChart, generateUsersData, generateCollaboratorsData } from "@/components/charts/SimpleLineChart";

interface UsageTabProps {
  filter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  periodValue: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

export function UsageTab({
  filter,
  onFilterChange,
  periodValue,
  onPeriodChange,
}: UsageTabProps) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Utilização</h2>
        <FilterButtons
          value={filter}
          onChange={onFilterChange}
          periodValue={periodValue}
          onPeriodChange={onPeriodChange}
        />
      </div>

      {/* Channel Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Comunicados Enviados</CardTitle>
            <p className="text-xs text-muted-foreground">Por canal</p>
          </CardHeader>
          <CardContent>
            <ChannelBreakdownChart data={generateChannelData(filter)} height={280} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Disparos Totais</CardTitle>
            <p className="text-xs text-muted-foreground">Por canal</p>
          </CardHeader>
          <CardContent>
            <ChannelBreakdownChart data={generateDispatchData(filter)} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* User Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Usuários na Base</CardTitle>
            <p className="text-xs text-muted-foreground">Evolução ao longo do tempo</p>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={generateUsersData(filter)} height={200} color="hsl(var(--color-growth))" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Colaboradores Cadastrados</CardTitle>
            <p className="text-xs text-muted-foreground">Evolução ao longo do tempo</p>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={generateCollaboratorsData(filter)} height={200} color="hsl(var(--color-growth))" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
