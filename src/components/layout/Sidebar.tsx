import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Share2,
  Users,
  UserCircle,
  ClipboardList,
} from "lucide-react";

const navigation = [
  { name: "Visão Geral", href: "/", icon: BarChart3 },
  { name: "Growth", href: "/growth", icon: TrendingUp },
  { name: "Presença & Mídias", href: "/presence", icon: Share2 },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Raio-X Cliente", href: "/customer-detail", icon: UserCircle },
  { name: "Registro de Ações", href: "/actions", icon: ClipboardList },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-background">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-sidebar-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">CEO Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
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
          <div className="flex items-center gap-3 rounded p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <UserCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-sidebar-foreground">CEO</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
