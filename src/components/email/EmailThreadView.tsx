import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, ChevronDown, ChevronUp, Paperclip, Download, Loader2, FileText, Image, File, FileSpreadsheet, FileCode, FileArchive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
}

interface EmailMessage {
  id: string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  sent_at: string;
  attachments: Attachment[] | unknown;
}

interface EmailThreadViewProps {
  actionId: string;
}

function getFileIcon(contentType: string, filename: string) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  
  // Images
  if (contentType?.startsWith("image/")) return { icon: Image, color: "text-green-500", bg: "bg-green-500/10" };
  
  // PDFs
  if (contentType === "application/pdf" || ext === "pdf") return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" };
  
  // Spreadsheets
  if (contentType?.includes("spreadsheet") || contentType?.includes("excel") || 
      ["csv", "xlsx", "xls"].includes(ext)) return { icon: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  
  // Documents
  if (contentType?.includes("document") || contentType?.includes("word") ||
      ["doc", "docx", "txt", "rtf"].includes(ext)) return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
  
  // Code files
  if (["js", "ts", "json", "xml", "html", "css"].includes(ext)) return { icon: FileCode, color: "text-yellow-500", bg: "bg-yellow-500/10" };
  
  // Archives
  if (contentType?.includes("zip") || contentType?.includes("archive") ||
      ["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { icon: FileArchive, color: "text-purple-500", bg: "bg-purple-500/10" };
  
  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" };
}

export function EmailThreadView({ actionId }: EmailThreadViewProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetchMessages();
  }, [actionId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("email_messages")
        .select("*")
        .eq("action_id", actionId)
        .order("sent_at", { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setMessages(data as EmailMessage[]);
        // Expand the last message by default
        setExpandedMessages(new Set([data[data.length - 1].id]));
      }
    } catch (error) {
      console.error("Error fetching email messages:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDownloadAttachment = async (attachment: Attachment, messageId: string) => {
    try {
      setDownloadingAttachments(prev => new Set(prev).add(attachment.id));

      const { data, error } = await supabase.functions.invoke("download-attachment", {
        body: {
          attachmentId: attachment.id,
          filename: attachment.filename,
          messageId,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open the file in a new tab or trigger download
        const link = document.createElement("a");
        link.href = data.url;
        link.download = attachment.filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download iniciado",
          description: `${attachment.filename}`,
        });
      }
    } catch (error: any) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Erro ao baixar anexo",
        description: error.message || "Não foi possível baixar o anexo",
        variant: "destructive",
      });
    } finally {
      setDownloadingAttachments(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });
    }
  };

  const formatSender = (message: EmailMessage) => {
    if (message.from_name) {
      return `${message.from_name} <${message.from_email}>`;
    }
    return message.from_email;
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
        <p>Nenhuma mensagem de e-mail encontrada</p>
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
          const isExpanded = expandedMessages.has(message.id);
          const isLast = index === messages.length - 1;

          return (
            <div
              key={message.id}
              className={cn(
                "border border-border rounded-lg overflow-hidden transition-all",
                isExpanded ? "bg-card" : "bg-card/50 hover:bg-card"
              )}
            >
              {/* Message header - clickable */}
              <button
                onClick={() => toggleMessage(message.id)}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(message.from_name || message.from_email)[0].toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">
                      {message.from_name || message.from_email}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(message.sent_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {!isExpanded && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {message.body_text?.slice(0, 100)}...
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
                      <span className="flex-1">{formatSender(message)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">Para:</span>
                      <span className="flex-1">{message.to_emails.join(", ")}</span>
                    </div>
                    {message.cc_emails.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 flex-shrink-0">CC:</span>
                        <span className="flex-1">{message.cc_emails.join(", ")}</span>
                      </div>
                    )}
                    {message.subject && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 flex-shrink-0">Assunto:</span>
                        <span className="flex-1 font-medium">{message.subject}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">Data:</span>
                      <span className="flex-1">
                        {format(new Date(message.sent_at), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Email body */}
                  <div className="prose prose-invert prose-sm max-w-none">
                    {message.body_html ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: message.body_html }} 
                        className="email-content"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {message.body_text}
                      </pre>
                    )}
                  </div>

                  {/* Attachments */}
                  {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        {message.attachments.length} anexo(s)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {message.attachments.map((att: Attachment, i: number) => {
                          const { icon: FileIcon, color, bg } = getFileIcon(att.content_type || "", att.filename || "");
                          const isDownloading = downloadingAttachments.has(att.id);
                          
                          return (
                            <button
                              key={att.id || i}
                              onClick={() => handleDownloadAttachment(att, message.id)}
                              disabled={isDownloading}
                              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                            >
                              <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
                                <FileIcon className={cn("h-5 w-5", color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {att.filename || "Anexo"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {att.content_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                </p>
                              </div>
                              {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                              ) : (
                                <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
