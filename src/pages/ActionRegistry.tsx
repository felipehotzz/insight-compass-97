import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Video,
  Mail,
  Phone,
  MessageSquare,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const actionTypes = [
  { id: "meeting", label: "Reunião", icon: Video },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "call", label: "Ligação", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const actionTypeLabels: Record<string, string> = {
  meeting: "Reunião",
  email: "E-mail",
  call: "Ligação",
  whatsapp: "WhatsApp",
};

const categoryLabels: Record<string, string> = {
  renovacao: "Renovação",
  expansao: "Expansão",
  onboarding: "Onboarding",
  contencao: "Contenção",
  suporte: "Suporte / Dúvidas",
  tecnica: "Técnica",
  relacionamento: "Relacionamento",
};

interface Action {
  id: string;
  title: string;
  description: string | null;
  customer: string;
  action_type: string;
  category: string | null;
  action_date: string;
}

const ActionRegistry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [actions, setActions] = useState<Action[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .order("action_date", { ascending: false });

      if (error) throw error;

      setActions(data || []);

      // Extract unique customers
      const uniqueCustomers = [...new Set(data?.map((a) => a.customer) || [])];
      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error("Error fetching actions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = actions.filter((action) => {
    const matchesSearch =
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" || actionTypeLabels[action.action_type] === filterType;
    const matchesCustomer =
      filterCustomer === "all" || action.customer === filterCustomer;
    return matchesSearch && matchesType && matchesCustomer;
  });

  const handleSelectAction = (actionId: string, checked: boolean) => {
    setSelectedActions((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(actionId);
      } else {
        newSet.delete(actionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedActions(new Set(filteredActions.map((a) => a.id)));
    } else {
      setSelectedActions(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedActions.size === 0) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("actions")
        .delete()
        .in("id", Array.from(selectedActions));

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedActions.size} ação(ões) excluída(s) com sucesso`,
      });

      setSelectedActions(new Set());
      fetchActions();
    } catch (error) {
      console.error("Error deleting actions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir as ações",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-xl text-foreground">Ações</h1>
        
        {/* Header with filters and add button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {actionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.label}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer} value={customer}>
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {selectedActions.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir {selectedActions.size}
              </Button>
            )}
            <Button className="shrink-0" onClick={() => navigate("/actions/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          </div>
        </div>

        {/* Counter */}
        <p className="text-sm text-muted-foreground">
          {filteredActions.length} ações registradas
        </p>

        {/* Actions list */}
        <div className="glass-card p-5">
          <div className="space-y-0">
            <div className="grid grid-cols-[40px_1fr_1fr_100px_120px_100px] gap-4 px-2 py-2 text-xs font-medium text-muted-foreground uppercase border-b border-border">
              <div className="flex items-center">
                <Checkbox
                  checked={filteredActions.length > 0 && selectedActions.size === filteredActions.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </div>
              <span>Ação</span>
              <span>Cliente</span>
              <span>Tipo</span>
              <span>Tema</span>
              <span className="text-right">Data</span>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma ação encontrada
                </div>
              ) : (
                filteredActions.map((action) => (
                  <div 
                    key={action.id} 
                    className="grid grid-cols-[40px_1fr_1fr_100px_120px_100px] gap-4 px-2 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedActions.has(action.id)}
                        onCheckedChange={(checked) => handleSelectAction(action.id, !!checked)}
                      />
                    </div>
                    <span 
                      className="text-sm font-medium truncate cursor-pointer"
                      onClick={() => navigate(`/actions/new?edit=${action.id}`)}
                    >
                      {action.title}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">{action.customer}</span>
                    <Badge variant="outline" className="w-fit text-xs">
                      {actionTypeLabels[action.action_type] || action.action_type}
                    </Badge>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {categoryLabels[action.category || ""] || action.category || "-"}
                    </Badge>
                    <span className="text-sm text-muted-foreground text-right">
                      {new Date(action.action_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActionRegistry;
