import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { 
  BarChart3, 
  TrendingUp, 
  Share2, 
  Users, 
  Globe, 
  ClipboardList,
  UserPlus,
  KeyRound,
  Ticket,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppPage = "visao_geral" | "pipeline" | "growth" | "clientes" | "raio_x" | "acoes" | "convidar" | "perfis_acesso" | "tickets";
type AppRole = "admin" | "editor" | "viewer" | "customer_success" | "growth";

const pages: { id: AppPage; name: string; icon: any }[] = [
  { id: "visao_geral", name: "Visão Geral", icon: BarChart3 },
  { id: "pipeline", name: "Pipeline", icon: TrendingUp },
  { id: "growth", name: "Growth", icon: Share2 },
  { id: "clientes", name: "Clientes", icon: Users },
  { id: "raio_x", name: "Raio-X", icon: Globe },
  { id: "acoes", name: "Ações", icon: ClipboardList },
  { id: "tickets", name: "Tickets", icon: Ticket },
  { id: "convidar", name: "Convidar pessoas", icon: UserPlus },
  { id: "perfis_acesso", name: "Perfis de Acesso", icon: KeyRound },
];

const roles: { id: AppRole; name: string }[] = [
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor" },
  { id: "viewer", name: "Visualizador" },
  { id: "customer_success", name: "Customer Success" },
  { id: "growth", name: "Growth" },
];

export function AccessProfileSettings() {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [activeRole, setActiveRole] = useState<AppRole>("admin");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, page, can_view");

      if (error) throw error;

      // Group permissions by role
      const grouped: Record<string, Record<string, boolean>> = {};
      roles.forEach(role => {
        grouped[role.id] = {};
        pages.forEach(page => {
          grouped[role.id][page.id] = false;
        });
      });

      data?.forEach((item) => {
        if (grouped[item.role]) {
          grouped[item.role][item.page] = item.can_view;
        }
      });

      setPermissions(grouped);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Erro ao carregar permissões");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (pageId: AppPage) => {
    const currentValue = permissions[activeRole]?.[pageId] ?? false;
    const newValue = !currentValue;

    // Optimistic update
    setPermissions((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [pageId]: newValue,
      },
    }));

    setUpdating(pageId);

    try {
      const { error } = await supabase
        .from("role_permissions")
        .update({ can_view: newValue })
        .eq("role", activeRole as any)
        .eq("page", pageId as any);

      if (error) throw error;
    } catch (error) {
      // Revert on error
      setPermissions((prev) => ({
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          [pageId]: currentValue,
        },
      }));
      console.error("Error updating permission:", error);
      toast.error("Erro ao atualizar permissão");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Perfil de Acesso</h2>
        <p className="text-muted-foreground text-sm">
          Configure quais páginas cada perfil pode visualizar
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeRole === role.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>

      {/* Pages List */}
      <div className="border border-border rounded-lg divide-y divide-border max-h-[400px] overflow-y-auto">
        {pages.map((page) => {
          const Icon = page.icon;
          const isEnabled = permissions[activeRole]?.[page.id] ?? false;
          const isUpdating = updating === page.id;
          
          return (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium">{page.name}</span>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={() => togglePermission(page.id)}
                disabled={isUpdating}
              />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        As alterações são salvas automaticamente
      </p>
    </div>
  );
}
