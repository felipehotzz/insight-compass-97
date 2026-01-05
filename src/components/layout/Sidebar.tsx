import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Share2,
  Users,
  UserCircle,
  ClipboardList,
  Search,
  BarChart3,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import logoImg from "@/assets/logo-comunica.png";

type AppPage = "visao_geral" | "pipeline" | "growth" | "clientes" | "raio_x" | "acoes";

const navigation: { name: string; href: string; icon: any; permission: AppPage }[] = [
  { name: "Visão Geral", href: "/", icon: BarChart3, permission: "visao_geral" },
  { name: "Pipeline", href: "/pipeline", icon: TrendingUp, permission: "pipeline" },
  { name: "Growth", href: "/growth", icon: Share2, permission: "growth" },
  { name: "Clientes", href: "/customers", icon: Users, permission: "clientes" },
  { name: "Raio-X", href: "/customer-detail", icon: UserCircle, permission: "raio_x" },
  { name: "Ações", href: "/actions", icon: ClipboardList, permission: "acoes" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { canView, loading: permissionsLoading } = usePermissions();

  const filteredNavigation = navigation.filter((item) => canView(item.permission));

  const openSearch = () => {
    // Dispatch keyboard event to trigger Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-52 border-r border-sidebar-border bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center border-b border-sidebar-border px-5">
            <img 
              src={logoImg} 
              alt="Comunica.in" 
              className="h-6 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {/* Search button */}
            <button
              onClick={openSearch}
              className="nav-item w-full justify-between group"
            >
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4" />
                <span className="text-sm">Busca</span>
              </div>
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60 inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item ${isActive ? "nav-item-active" : ""}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded p-2 hover:bg-secondary/50 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <UserCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-sidebar-foreground truncate max-w-[120px]">
                      {profile?.name || "Usuário"}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="start" 
                className="w-48 p-1 bg-popover border border-border"
              >
                <div className="flex flex-col">
                  <button className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary/50 transition-colors text-left">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </button>
                  <button 
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary/50 transition-colors text-left"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
