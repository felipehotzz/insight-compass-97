import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Dispatch {
  id: string;
  comunicado: string;
  cliente: string;
  sent_at: string;
  status: "enviado" | "erro" | "processando";
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
      .order("sent_at", { ascending: false })
      .limit(200);

    if (filters.cliente) {
      query = query.ilike("cliente", `%${filters.cliente}%`);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.date) {
      query = query.gte("sent_at", `${filters.date}T00:00:00`).lte("sent_at", `${filters.date}T23:59:59`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDispatches(data as Dispatch[]);
    }
    setLoading(false);
  }, [filters]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchDispatches();
    const interval = setInterval(fetchDispatches, 30000);
    return () => clearInterval(interval);
  }, [fetchDispatches]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("dispatches-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatches" },
        () => {
          fetchDispatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDispatches]);

  // Counter period filtering
  const getCounterDispatches = (period: string) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    return dispatches.filter((d) => {
      const sentDate = new Date(d.sent_at);
      switch (period) {
        case "hoje":
          return d.sent_at.startsWith(today);
        case "semana": {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return sentDate >= weekAgo;
        }
        case "mes": {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return sentDate >= monthAgo;
        }
        case "3meses": {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return sentDate >= threeMonthsAgo;
        }
        default:
          return d.sent_at.startsWith(today);
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
    };
  };

  // Unique clients for filter dropdown
  const uniqueClients = [...new Set(dispatches.map((d) => d.cliente))].sort();

  return { dispatches, loading, filters, setFilters, getCounters, uniqueClients, refetch: fetchDispatches };
}
