import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Share2,
  Users,
  UserCircle,
  Building2,
} from "lucide-react";

const navigation = [
  { name: "Visão Geral", href: "/", icon: BarChart3 },
  { name: "Growth", href: "/growth", icon: TrendingUp },
  { name: "Presença & Mídias", href: "/presence", icon: Share2 },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Raio-X Cliente", href: "/customer-detail", icon: UserCircle },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-effect">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">CEO Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive ? "nav-item-active" : ""}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">CEO</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
