import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, ChevronDown, ChevronUp, User, Headphones } from "lucide-react";
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
}

export function IntercomThreadView({ messages, loading }: IntercomThreadViewProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(() => {
    // Expand the last message by default
    if (messages.length > 0) {
      return new Set([messages[messages.length - 1].id || `msg-${messages.length - 1}`]);
    }
    return new Set();
  });

  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isClientMessage = (authorType: string) => {
    return authorType === "user" || authorType === "lead";
  };

  const getAuthorLabel = (message: IntercomMessage) => {
    if (message.author_name) return message.author_name;
    return isClientMessage(message.author_type) ? "Cliente" : "Suporte";
  };

  const getPreviewText = (html: string | null) => {
    if (!html) return "";
    const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return stripped.length > 100 ? stripped.slice(0, 100) + "..." : stripped;
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
    <div className="space-y-2">
      {/* Thread header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Mail className="h-4 w-4" />
        <span>{messages.length} {messages.length === 1 ? "mensagem" : "mensagens"} nesta conversa</span>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((message, index) => {
          const messageId = message.id || `msg-${index}`;
          const isExpanded = expandedMessages.has(messageId);
          const isClient = isClientMessage(message.author_type);

          return (
            <div
              key={messageId}
              className={cn(
                "border border-border rounded-lg overflow-hidden transition-all",
                isExpanded ? "bg-card" : "bg-card/50 hover:bg-card"
              )}
            >
              {/* Message header - clickable */}
              <button
                onClick={() => toggleMessage(messageId)}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
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

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-foreground">
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
                  
                  {!isExpanded && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {getPreviewText(message.body)}
                    </p>
                  )}
                </div>

                {/* Expand icon */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  {/* Email metadata */}
                  <div className="text-sm space-y-1 mb-4 pb-4 border-b border-border">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">De:</span>
                      <span className="flex-1 text-foreground">{getAuthorLabel(message)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">Data:</span>
                      <span className="flex-1 text-foreground">
                        {format(new Date(message.created_at), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="prose prose-sm max-w-none">
                    {message.body ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: message.body }} 
                        className="email-content text-foreground [&_*]:text-foreground [&_a]:!text-primary [&_a]:underline [&_p]:mb-2 [&_br]:block"
                        style={{ color: 'hsl(var(--foreground))' }}
                      />
                    ) : (
                      <p className="text-muted-foreground italic">Sem conteúdo</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
