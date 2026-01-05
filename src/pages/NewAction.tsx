import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Save,
  Link as LinkIcon,
  FileText,
  Type,
  List,
  Image,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const actionTypes = [
  { id: "meeting", label: "Reunião", icon: Video },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "call", label: "Ligação", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const customers = [
  { id: "1", name: "Grendene" },
  { id: "2", name: "Ambev" },
  { id: "3", name: "CBMM" },
  { id: "4", name: "Localiza" },
  { id: "5", name: "Natura" },
];

const NewAction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") || "";

  const [customer, setCustomer] = useState(preselectedCustomer);
  const [actionType, setActionType] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");

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

    // Mock save - would connect to backend
    toast({
      title: "Ação salva",
      description: "A ação foi registrada com sucesso.",
    });
    navigate("/actions");
  };

  const getActionTypeIcon = () => {
    const type = actionTypes.find((t) => t.id === actionType);
    return type ? <type.icon className="h-5 w-5" /> : null;
  };

  return (
    <DashboardLayout title="Nova Ação">
      <div className="animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/actions")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Ação
          </Button>
        </div>

        {/* Main content area */}
        <div className="max-w-3xl mx-auto">
          {/* Required fields header */}
          <div className="glass-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente *
                </label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
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

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tipo de Ação *
                </label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
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

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Título *
                </label>
                <Input
                  placeholder="Ex: Reunião de alinhamento trimestral"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data *
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                {actionType && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {getActionTypeIcon()}
                    <span className="text-sm">
                      {actionTypes.find((t) => t.id === actionType)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notion-like content area */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Conteúdo
              </p>
              
              {/* Toolbar */}
              <div className="flex items-center gap-1 pb-4 border-b border-border mb-4">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <Type className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content editor */}
            <Textarea
              placeholder="Comece a escrever aqui...

Você pode adicionar:
• Notas da reunião ou conversa
• Links importantes
• Transcrição de áudio/vídeo
• Próximos passos acordados
• Qualquer informação relevante"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] resize-none border-0 p-0 focus-visible:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewAction;
