import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet } from "lucide-react";

interface CsvPreview {
  headers: string[];
  rows: string[][];
}

interface CsvPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  csvPreview: CsvPreview | null;
}

export function CsvPreviewDialog({
  open,
  onOpenChange,
  fileName,
  csvPreview,
}: CsvPreviewDialogProps) {
  if (!csvPreview) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {fileName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-2">
          Mostrando as primeiras {csvPreview.rows.length} linhas do arquivo
        </div>

        <ScrollArea className="h-[60vh] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {csvPreview.headers.map((header, index) => (
                  <TableHead
                    key={index}
                    className="whitespace-nowrap bg-muted/50 font-semibold"
                  >
                    {header || `Coluna ${index + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvPreview.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className="whitespace-nowrap max-w-[300px] truncate"
                      title={cell}
                    >
                      {cell || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
