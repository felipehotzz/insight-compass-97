import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Users, Settings, Shield, Bell, KeyRound } from "lucide-react";
import { UsersSettings } from "./UsersSettings";
import { AccessProfileSettings } from "./AccessProfileSettings";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const settingsNavigation = [
  { id: "users", name: "Usuários", icon: Users },
  { id: "access", name: "Perfil de Acesso", icon: KeyRound },
  { id: "general", name: "Geral", icon: Settings },
  { id: "security", name: "Segurança", icon: Shield },
  { id: "notifications", name: "Notificações", icon: Bell },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("users");

  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return <UsersSettings />;
      case "access":
        return <AccessProfileSettings />;
      case "general":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">Geral</h2>
            <p className="text-muted-foreground">Configurações gerais da aplicação.</p>
          </div>
        );
      case "security":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">Segurança</h2>
            <p className="text-muted-foreground">Configurações de segurança.</p>
          </div>
        );
      case "notifications":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">Notificações</h2>
            <p className="text-muted-foreground">Configurações de notificações.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-56 border-r border-border bg-secondary/30 p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 px-2">
              Configurações
            </h3>
            <nav className="space-y-1">
              {settingsNavigation.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
