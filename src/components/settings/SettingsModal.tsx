import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Users, Settings, Shield, Bell, KeyRound, Upload } from "lucide-react";
import { UsersSettings } from "./UsersSettings";
import { AccessProfileSettings } from "./AccessProfileSettings";
import { ImportDataSettings } from "./ImportDataSettings";
import { usePermissions } from "@/hooks/usePermissions";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const settingsNavigation = [
  { id: "users", name: "Usuários", icon: Users, permission: null },
  { id: "access", name: "Perfil de Acesso", icon: KeyRound, permission: "perfis_acesso" as const },
  { id: "import", name: "Importar Dados", icon: Upload, permission: null },
  { id: "general", name: "Geral", icon: Settings, permission: null },
  { id: "security", name: "Segurança", icon: Shield, permission: null },
  { id: "notifications", name: "Notificações", icon: Bell, permission: null },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("users");
  const { canView } = usePermissions();

  const filteredNavigation = settingsNavigation.filter((item) => {
    if (!item.permission) return true;
    return canView(item.permission);
  });

  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return <UsersSettings />;
      case "access":
        return <AccessProfileSettings />;
      case "import":
        return <ImportDataSettings />;
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
      <DialogContent className="max-w-5xl h-[80vh] max-h-[80vh] p-0 gap-0 overflow-hidden flex flex-col">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-56 border-r border-border bg-secondary/30 p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 px-2">
              Configurações
            </h3>
            <nav className="space-y-1">
              {filteredNavigation.map((item) => {
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
