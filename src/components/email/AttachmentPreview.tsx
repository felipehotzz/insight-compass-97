import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, X, ExternalLink, FileText, Image as ImageIcon, File, FileSpreadsheet, FileCode, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
}

interface AttachmentPreviewProps {
  attachment: Attachment | null;
  url: string | null;
  isLoading: boolean;
  onClose: () => void;
  onDownload: () => void;
}

function getFileInfo(contentType: string, filename: string) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  
  // Images
  if (contentType?.startsWith("image/")) {
    return { 
      icon: ImageIcon, 
      color: "text-green-500", 
      bg: "bg-green-500/10",
      type: "image",
      label: "Imagem"
    };
  }
  
  // PDFs
  if (contentType === "application/pdf" || ext === "pdf") {
    return { 
      icon: FileText, 
      color: "text-red-500", 
      bg: "bg-red-500/10",
      type: "pdf",
      label: "Documento PDF"
    };
  }
  
  // Spreadsheets
  if (contentType?.includes("spreadsheet") || contentType?.includes("excel") || 
      ["csv", "xlsx", "xls"].includes(ext)) {
    return { 
      icon: FileSpreadsheet, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      type: "spreadsheet",
      label: "Planilha"
    };
  }
  
  // Documents
  if (contentType?.includes("document") || contentType?.includes("word") ||
      ["doc", "docx", "txt", "rtf"].includes(ext)) {
    return { 
      icon: FileText, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      type: "document",
      label: "Documento"
    };
  }
  
  // Code files
  if (["js", "ts", "json", "xml", "html", "css"].includes(ext)) {
    return { 
      icon: FileCode, 
      color: "text-yellow-500", 
      bg: "bg-yellow-500/10",
      type: "code",
      label: "Código"
    };
  }
  
  // Archives
  if (contentType?.includes("zip") || contentType?.includes("archive") ||
      ["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { 
      icon: FileArchive, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      type: "archive",
      label: "Arquivo compactado"
    };
  }
  
  return { 
    icon: File, 
    color: "text-muted-foreground", 
    bg: "bg-muted",
    type: "file",
    label: "Arquivo"
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function AttachmentPreview({ attachment, url, isLoading, onClose, onDownload }: AttachmentPreviewProps) {
  const [imageError, setImageError] = useState(false);
  
  if (!attachment) return null;
  
  const fileInfo = getFileInfo(attachment.content_type || "", attachment.filename || "");
  const FileIcon = fileInfo.icon;
  
  const canPreview = url && !isLoading;
  const isImage = fileInfo.type === "image" && !imageError;
  const isPdf = fileInfo.type === "pdf";

  return (
    <Dialog open={!!attachment} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 pr-8">
            <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", fileInfo.bg)}>
              <FileIcon className={cn("h-5 w-5", fileInfo.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{attachment.filename}</p>
              <p className="text-sm text-muted-foreground">{fileInfo.label}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando preview...</p>
            </div>
          ) : canPreview && isImage ? (
            <div className="flex items-center justify-center p-4 bg-black/20 rounded-lg">
              <img 
                src={url} 
                alt={attachment.filename}
                className="max-w-full max-h-[60vh] object-contain rounded"
                onError={() => setImageError(true)}
              />
            </div>
          ) : canPreview && isPdf ? (
            <div className="w-full h-[60vh] rounded-lg overflow-hidden">
              <iframe 
                src={`${url}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={attachment.filename}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center mb-6", fileInfo.bg)}>
                <FileIcon className={cn("h-12 w-12", fileInfo.color)} />
              </div>
              <p className="text-lg font-medium mb-2">{attachment.filename}</p>
              <p className="text-muted-foreground mb-1">{fileInfo.label}</p>
              <p className="text-sm text-muted-foreground">
                {attachment.content_type || "Tipo desconhecido"}
              </p>
              {!canPreview && !isLoading && (
                <p className="text-sm text-muted-foreground mt-4">
                  Preview não disponível para este tipo de arquivo
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t border-border">
          {url && (
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </a>
            </Button>
          )}
          <Button onClick={onDownload} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
