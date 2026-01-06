import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotionEditor } from "@/components/editor/NotionEditor";
import { EmailThreadView } from "@/components/email/EmailThreadView";
import { CustomerDropdown } from "@/components/actions/CustomerDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Video,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Building2,
  Tag,
  Users,
  X,
  FolderOpen,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Shield,
  HelpCircle,
  Wrench,
  Heart,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const actionTypes = [
  { id: "meeting", label: "Reunião", icon: Video },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "call", label: "Ligação", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const categories = [
  { id: "renovacao", label: "Renovação", icon: RefreshCw },
  { id: "expansao", label: "Expansão", icon: TrendingUp },
  { id: "onboarding", label: "Onboarding", icon: UserPlus },
  { id: "contencao", label: "Contenção", icon: Shield },
  { id: "suporte", label: "Suporte / Dúvidas", icon: HelpCircle },
  { id: "tecnica", label: "Técnica", icon: Wrench },
  { id: "relacionamento", label: "Relacionamento", icon: Heart },
];

const teamMembers = [
  { id: "1", name: "Ana Silva", initials: "AS" },
  { id: "2", name: "Bruno Costa", initials: "BC" },
  { id: "3", name: "Carla Dias", initials: "CD" },
  { id: "4", name: "Diego Oliveira", initials: "DO" },
  { id: "5", name: "Elena Santos", initials: "ES" },
];

const NewAction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") || "";
  const editId = searchParams.get("edit");
  const { user } = useAuth();

  const [customer, setCustomer] = useState(preselectedCustomer);
  const [actionType, setActionType] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; nome_fantasia: string }[]>([]);

  // Fetch customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, nome_fantasia")
        .order("nome_fantasia");
      
      if (data && !error) {
        setCustomers(data);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (editId) {
      fetchAction(editId);
    }
  }, [editId]);

  const fetchAction = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setCustomer(data.customer);
        setActionType(data.action_type);
        setCategory(data.category || "");
        setDate(data.action_date);
        setContent(data.content || "");
        setResponsibles(data.responsibles || []);
      }
    } catch (error) {
      console.error("Error fetching action:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a ação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleResponsible = (memberId: string) => {
    setResponsibles((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getSelectedMembers = () => {
    return teamMembers.filter((m) => responsibles.includes(m.id));
  };

  const isValid = customer && actionType && title && date;

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const actionData = {
        title,
        customer,
        action_type: actionType,
        category: category || null,
        action_date: date,
        content: content || null,
        responsibles,
        user_id: user?.id || null,
      };

      if (editId) {
        const { error } = await supabase
          .from("actions")
          .update(actionData)
          .eq("id", editId);

        if (error) throw error;

        toast({
          title: "Ação atualizada",
          description: "A ação foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase.from("actions").insert(actionData);

        if (error) throw error;

        toast({
          title: "Ação salva",
          description: "A ação foi registrada com sucesso.",
        });
      }

      navigate("/actions");
    } catch (error: any) {
      console.error("Error saving action:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a ação",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editId) return;

    if (!confirm("Tem certeza que deseja excluir esta ação?")) return;

    try {
      const { error } = await supabase.from("actions").delete().eq("id", editId);

      if (error) throw error;

      toast({
        title: "Ação excluída",
        description: "A ação foi excluída com sucesso.",
      });

      navigate("/actions");
    } catch (error: any) {
      console.error("Error deleting action:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a ação",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <div className="animate-fade-in max-w-3xl mx-auto py-8">
        {/* Minimal top bar */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            {editId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={!isValid || saving}>
              {saving ? "Salvando..." : editId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Title input - Notion style */}
        <input
          type="text"
          placeholder="Sem título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-6"
        />

        {/* Properties row - inline like Notion */}
        <div className="space-y-3 mb-8 text-sm">
          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-2 text-muted-foreground w-28">
              <Building2 className="h-4 w-4" />
              <span>Cliente</span>
            </div>
            <CustomerDropdown
              customers={customers}
              value={customer}
              onValueChange={setCustomer}
            />
          </div>

          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-2 text-muted-foreground w-28">
              <Tag className="h-4 w-4" />
              <span>Tipo</span>
            </div>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-auto min-w-[160px] border-none bg-transparent hover:bg-secondary/50 h-8 px-2">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-2 text-muted-foreground w-28">
              <FolderOpen className="h-4 w-4" />
              <span>Categoria</span>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-auto min-w-[160px] border-none bg-transparent hover:bg-secondary/50 h-8 px-2">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-2 text-muted-foreground w-28">
              <Calendar className="h-4 w-4" />
              <span>Data</span>
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto border-none bg-transparent hover:bg-secondary/50 h-8 px-2"
            />
          </div>

          <div className="flex items-start gap-3 group">
            <div className="flex items-center gap-2 text-muted-foreground w-28 pt-1">
              <Users className="h-4 w-4" />
              <span>Responsável</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {getSelectedMembers().map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-sm"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-medium">
                      {member.initials}
                    </span>
                    {member.name}
                    <button
                      onClick={() => toggleResponsible(member.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Select onValueChange={toggleResponsible}>
                  <SelectTrigger className="w-auto border-none bg-transparent hover:bg-secondary/50 h-8 px-2">
                    <SelectValue placeholder="Adicionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers
                      .filter((m) => !responsibles.includes(m.id))
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                              {member.initials}
                            </span>
                            {member.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-6" />

        {/* Content area - different view based on action type */}
        {actionType === "email" && editId ? (
          <EmailThreadView actionId={editId} />
        ) : (
          <NotionEditor 
            initialContent={content} 
            onChange={(blocks) => setContent(JSON.stringify(blocks))} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewAction;
