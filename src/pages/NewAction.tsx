import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotionEditor } from "@/components/editor/NotionEditor";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

const customers = [
  { id: "1", name: "Grendene" },
  { id: "2", name: "Ambev" },
  { id: "3", name: "CBMM" },
  { id: "4", name: "Localiza" },
  { id: "5", name: "Natura" },
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

  const [customer, setCustomer] = useState(preselectedCustomer);
  const [actionType, setActionType] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [responsibles, setResponsibles] = useState<string[]>([]);

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

  const handleSave = () => {
    if (!isValid) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ação salva",
      description: "A ação foi registrada com sucesso.",
    });
    navigate("/actions");
  };

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
          <Button size="sm" onClick={handleSave} disabled={!isValid}>
            Salvar
          </Button>
        </div>

        {/* Title input - Notion style */}
        <input
          type="text"
          placeholder="Sem título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-8"
        />

        {/* Properties row - inline like Notion */}
        <div className="space-y-3 mb-8 text-sm">
          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-2 text-muted-foreground w-28">
              <Building2 className="h-4 w-4" />
              <span>Cliente</span>
            </div>
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger className="w-auto min-w-[160px] border-none bg-transparent hover:bg-secondary/50 h-8 px-2">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Content area - Notion-style editor */}
        <NotionEditor onChange={(blocks) => console.log(blocks)} />
      </div>
    </DashboardLayout>
  );
};

export default NewAction;
