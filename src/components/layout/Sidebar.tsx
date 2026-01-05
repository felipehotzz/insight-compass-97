import { Link, useLocation } from "react-router-dom";
import {
  TrendingUp,
  Share2,
  Users,
  UserCircle,
  ClipboardList,
  Search,
  BarChart3,
} from "lucide-react";
import logoImg from "@/assets/logo-comunica.png";

const navigation = [
  { name: "Visão Geral", href: "/", icon: BarChart3 },
  { name: "Pipeline", href: "/growth", icon: TrendingUp },
  { name: "Growth", href: "/presence", icon: Share2 },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Raio-X", href: "/customer-detail", icon: UserCircle },
  { name: "Ações", href: "/actions", icon: ClipboardList },
];

export function Sidebar() {
  const location = useLocation();

  const openSearch = () => {
    // Dispatch keyboard event to trigger Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
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
