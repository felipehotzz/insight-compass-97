import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Dispatch {
  id: string;
  comunicado: string;
  cliente: string;
  started_at: string | null;
  finished_at: string | null;
  status: "enviado" | "erro" | "processando" | "agendado";
  total_programmed: number;
  total_sent: number;
  total_errors: number;
  error_details: string | null;
  external_link: string | null;
  created_at: string;
}

interface Filters {
  cliente: string;
  status: string;
  date: string;
}

export function useDispatches() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ cliente: "", status: "", date: "" });

  const fetchDispatches = useCallback(async () => {
    let query = supabase
      .from("dispatches")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(200);

    if (filters.cliente) {
      query = query.ilike("cliente", `%${filters.cliente}%`);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.date) {
      query = query.gte("started_at", `${filters.date}T00:00:00`).lte("started_at", `${filters.date}T23:59:59`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDispatches(data as unknown as Dispatch[]);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchDispatches();
    const interval = setInterval(fetchDispatches, 30000);
    return () => clearInterval(interval);
  }, [fetchDispatches]);

  useEffect(() => {
    const channel = supabase
      .channel("dispatches-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches" }, () => fetchDispatches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDispatches]);

  const getCounterDispatches = (period: string) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return dispatches.filter((d) => {
      const ref = d.started_at || d.created_at;
      const refDate = new Date(ref);
      switch (period) {
        case "hoje": return ref.startsWith(today);
        case "semana": { const ago = new Date(now); ago.setDate(ago.getDate() - 7); return refDate >= ago; }
        case "mes": { const ago = new Date(now); ago.setMonth(ago.getMonth() - 1); return refDate >= ago; }
        case "3meses": { const ago = new Date(now); ago.setMonth(ago.getMonth() - 3); return refDate >= ago; }
        default: return ref.startsWith(today);
      }
    });
  };

  const getCounters = (period: string) => {
    const filtered = getCounterDispatches(period);
    return {
      total: filtered.length,
      enviado: filtered.filter((d) => d.status === "enviado").length,
      erro: filtered.filter((d) => d.status === "erro").length,
      processando: filtered.filter((d) => d.status === "processando").length,
      agendado: filtered.filter((d) => d.status === "agendado").length,
    };
  };

  const uniqueClients = [...new Set(dispatches.map((d) => d.cliente))].sort();

  return { dispatches, loading, filters, setFilters, getCounters, uniqueClients, refetch: fetchDispatches };
}
