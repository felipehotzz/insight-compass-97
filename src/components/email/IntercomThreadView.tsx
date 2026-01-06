import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, User, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntercomMessage {
  id: string;
  author_type: string;
  author_name: string | null;
  body: string | null;
  created_at: string;
}

interface IntercomThreadViewProps {
  messages: IntercomMessage[];
  loading?: boolean;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  createdAt?: string;
}

export function IntercomThreadView({ 
  messages, 
  loading,
  subject,
  fromName,
  fromEmail,
  createdAt
}: IntercomThreadViewProps) {

  const isClientMessage = (authorType: string) => {
    return authorType === "user" || authorType === "lead";
  };

  const getAuthorLabel = (message: IntercomMessage) => {
    if (message.author_name) return message.author_name;
    return isClientMessage(message.author_type) ? "Cliente" : "Suporte";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma mensagem encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thread header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>{messages.length} {messages.length === 1 ? "mensagem" : "mensagens"} nesta conversa</span>
      </div>

      {/* Messages - all expanded */}
      <div className="space-y-4">
        {messages.map((message, index) => {
          const messageId = message.id || `msg-${index}`;
          const isClient = isClientMessage(message.author_type);

          return (
            <div
              key={messageId}
              className="border border-border rounded-lg overflow-hidden bg-card"
            >
              {/* Message header */}
              <div className="flex items-start gap-3 p-4 border-b border-border bg-secondary/30">
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  isClient ? "bg-secondary" : "bg-primary/20"
                )}>
                  {isClient ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Headphones className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Header content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {getAuthorLabel(message)}
                      </p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isClient 
                          ? "bg-secondary text-muted-foreground" 
                          : "bg-primary/10 text-primary"
                      )}>
                        {isClient ? "Cliente" : "Suporte"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(message.created_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {/* Show subject in first message if provided */}
                  {index === 0 && subject && (
                    <p className="text-sm text-foreground mt-1 font-medium">{subject}</p>
                  )}
                  {index === 0 && fromEmail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{fromEmail}</p>
                  )}
                </div>
              </div>

              {/* Message body - always visible */}
              <div className="p-4">
                <div className="prose prose-sm max-w-none">
                  {message.body ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: message.body }} 
                      className="email-content"
                    />
                  ) : (
                    <p className="text-muted-foreground italic">Sem conteúdo</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
