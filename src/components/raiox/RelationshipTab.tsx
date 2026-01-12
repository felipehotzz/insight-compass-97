import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterButtons } from "@/components/dashboard/FilterButtons";
import type { TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
import { ActionBreakdownChart } from "@/components/charts/ActionBreakdownChart";
import { ActionThemeChart } from "@/components/charts/ActionThemeChart";
import { useActionChartData } from "@/hooks/useActionChartData";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Action {
  id: string;
  title: string;
  customer: string;
  action_type: string;
  category: string | null;
  action_date: string;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
};

interface RelationshipTabProps {
  customerName: string;
  actions: Action[];
  filter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  periodValue: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

export function RelationshipTab({
  customerName,
  actions,
  filter,
  onFilterChange,
  periodValue,
  onPeriodChange,
}: RelationshipTabProps) {
  const navigate = useNavigate();
  
  // Process real actions data for charts
  const { typeData, themeData } = useActionChartData(actions, filter, periodValue);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Relacionamento</h2>
        <FilterButtons
          value={filter}
          onChange={onFilterChange}
          periodValue={periodValue}
          onPeriodChange={onPeriodChange}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Ações por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionBreakdownChart data={typeData} height={280} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Ações por tema</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionThemeChart data={themeData} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* Registro de Ações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Registro de Ações</p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(`/actions?customer=${encodeURIComponent(customerName)}`)}
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-transparent hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-normal">Ação</TableHead>
                <TableHead className="text-xs text-muted-foreground font-normal">Cliente</TableHead>
                <TableHead className="text-xs text-muted-foreground font-normal">Tipo</TableHead>
                <TableHead className="text-xs text-muted-foreground font-normal">Tema</TableHead>
                <TableHead className="text-xs text-muted-foreground font-normal text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions && actions.length > 0 ? (
                actions.map((action) => (
                  <TableRow 
                    key={action.id} 
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/actions/${action.id}`)}
                  >
                    <TableCell className="font-medium">{action.title}</TableCell>
                    <TableCell className="text-muted-foreground">{action.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {action.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {action.category || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(action.action_date)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma ação registrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
