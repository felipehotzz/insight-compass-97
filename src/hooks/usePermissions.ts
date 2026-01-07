import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppPage = "visao_geral" | "pipeline" | "growth" | "clientes" | "raio_x" | "acoes" | "convidar" | "perfis_acesso";

interface Permission {
  page: AppPage;
  can_view: boolean;
}

export function usePermissions() {
  const { userRole, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<Record<AppPage, boolean>>({
    visao_geral: false,
    pipeline: false,
    growth: false,
    clientes: false,
    raio_x: false,
    acoes: false,
    convidar: false,
    perfis_acesso: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && userRole?.role) {
      fetchPermissions(userRole.role);
    }
  }, [userRole?.role, authLoading]);

  const fetchPermissions = async (role: string) => {
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("page, can_view")
        .eq("role", role as any);

      if (error) throw error;

      if (data) {
        const permMap: Record<string, boolean> = {};
        data.forEach((p: Permission) => {
          permMap[p.page] = p.can_view;
        });
        setPermissions((prev) => ({ ...prev, ...permMap }));
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const canView = (page: AppPage): boolean => {
    return permissions[page] ?? false;
  };

  return {
    permissions,
    loading: loading || authLoading,
    canView,
  };
}
