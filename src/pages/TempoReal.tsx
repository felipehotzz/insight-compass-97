import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDispatches } from "@/hooks/useDispatches";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, RefreshCw, Send, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  enviado: { label: "Enviado", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  erro: { label: "Erro", className: "bg-red-500/15 text-red-600 border-red-500/20" },
  processando: { label: "Processando", className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
} as const;

const periodLabels: Record<string, string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
  "3meses": "Últimos 3 meses",
};

export default function TempoReal() {
  const { dispatches, loading, filters, setFilters, getCounters, uniqueClients, refetch } = useDispatches();
  const [counterPeriod, setCounterPeriod] = useState("hoje");
  const counters = getCounters(counterPeriod);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tempo Real</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoramento de envios da plataforma
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card relative">
            <div className="flex items-center justify-between">
              <p className="stat-label">Disparos</p>
              <Select value={counterPeriod} onValueChange={setCounterPeriod}>
                <SelectTrigger className="h-7 w-auto gap-1 border-none bg-secondary/50 text-xs px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(periodLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="stat-value">{counters.total}</p>
          </div>
          <StatCard
            title="Enviados"
            value={counters.enviado}
            className="border-l-2 border-l-emerald-500"
          />
          <StatCard
            title="Erros"
            value={counters.erro}
            className="border-l-2 border-l-red-500"
          />
          <StatCard
            title="Processando"
            value={counters.processando}
            className="border-l-2 border-l-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="Filtrar por cliente..."
            value={filters.cliente}
            onChange={(e) => setFilters((f) => ({ ...f, cliente: e.target.value }))}
            className="max-w-[240px]"
          />
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "all" ? "" : v }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="erro">Erro</SelectItem>
              <SelectItem value="processando">Processando</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            className="max-w-[180px]"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comunicado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erros</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : dispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum envio encontrado
                  </TableCell>
                </TableRow>
              ) : (
                dispatches.map((d) => {
                  const cfg = statusConfig[d.status] || statusConfig.processando;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.comunicado}</TableCell>
                      <TableCell>{d.cliente}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(d.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          {d.status === "enviado" && <Send className="h-3 w-3 mr-1" />}
                          {d.status === "erro" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {d.status === "processando" && <Clock className="h-3 w-3 mr-1" />}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {d.error_details || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.external_link ? (
                          <a
                            href={d.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Acessar <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Atualização automática a cada 30 segundos • Tempo real via WebSocket
        </p>
      </div>
    </DashboardLayout>
  );
}
