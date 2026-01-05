import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { 
  BarChart3, 
  TrendingUp, 
  Share2, 
  Users, 
  Globe, 
  ClipboardList,
  UserPlus,
  KeyRound
} from "lucide-react";

const pages = [
  { id: "visao-geral", name: "Visão Geral", icon: BarChart3 },
  { id: "pipeline", name: "Pipeline", icon: TrendingUp },
  { id: "growth", name: "Growth", icon: Share2 },
  { id: "clientes", name: "Clientes", icon: Users },
  { id: "raio-x", name: "Raio-X", icon: Globe },
  { id: "acoes", name: "Ações", icon: ClipboardList },
  { id: "convidar", name: "Convidar pessoas", icon: UserPlus },
  { id: "perfis-acesso", name: "Perfis de Acesso", icon: KeyRound },
];

const roles = [
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor" },
  { id: "viewer", name: "Visualizador" },
  { id: "customer-success", name: "Customer Success" },
  { id: "growth", name: "Growth" },
];

// Mock initial permissions (all enabled for admin, some for others)
const initialPermissions: Record<string, Record<string, boolean>> = {
  admin: {
    "visao-geral": true,
    "pipeline": true,
    "growth": true,
    "clientes": true,
    "raio-x": true,
    "acoes": true,
    "convidar": true,
    "perfis-acesso": true,
  },
  editor: {
    "visao-geral": true,
    "pipeline": true,
    "growth": true,
    "clientes": true,
    "raio-x": false,
    "acoes": true,
    "convidar": false,
    "perfis-acesso": false,
  },
  viewer: {
    "visao-geral": true,
    "pipeline": false,
    "growth": false,
    "clientes": true,
    "raio-x": false,
    "acoes": false,
    "convidar": false,
    "perfis-acesso": false,
  },
  "customer-success": {
    "visao-geral": true,
    "pipeline": false,
    "growth": false,
    "clientes": true,
    "raio-x": true,
    "acoes": true,
    "convidar": false,
    "perfis-acesso": false,
  },
  growth: {
    "visao-geral": true,
    "pipeline": true,
    "growth": true,
    "clientes": false,
    "raio-x": false,
    "acoes": false,
    "convidar": false,
    "perfis-acesso": false,
  },
};

export function AccessProfileSettings() {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [activeRole, setActiveRole] = useState("admin");

  const togglePermission = (pageId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [pageId]: !prev[activeRole][pageId],
      },
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Perfil de Acesso</h2>
        <p className="text-muted-foreground text-sm">
          Configure quais páginas cada perfil pode visualizar
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-2 mb-6">
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
      <div className="border border-border rounded-lg divide-y divide-border">
        {pages.map((page) => {
          const Icon = page.icon;
          const isEnabled = permissions[activeRole]?.[page.id] ?? false;
          
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
