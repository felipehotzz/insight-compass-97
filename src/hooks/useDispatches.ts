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

  // Today's counters
  const today = new Date().toISOString().split("T")[0];
  const todayDispatches = dispatches.filter((d) => d.sent_at.startsWith(today));
  const counters = {
    total: todayDispatches.length,
    enviado: todayDispatches.filter((d) => d.status === "enviado").length,
    erro: todayDispatches.filter((d) => d.status === "erro").length,
    processando: todayDispatches.filter((d) => d.status === "processando").length,
  };

  // Unique clients for filter dropdown
  const uniqueClients = [...new Set(dispatches.map((d) => d.cliente))].sort();

  return { dispatches, loading, filters, setFilters, counters, uniqueClients, refetch: fetchDispatches };
}
