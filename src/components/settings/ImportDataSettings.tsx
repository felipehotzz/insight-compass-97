import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type ImportStatus = "idle" | "reading" | "importing" | "success" | "error";

export function ImportDataSettings() {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<{ imported: number; months: string[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("reading");
    setResult(null);
    setErrorMessage("");

    try {
      const text = await file.text();
      setStatus("importing");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar logado para importar dados");
      }

      const { data, error } = await supabase.functions.invoke("import-financial-data", {
        body: { csvContent: text },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setStatus("success");
      toast.success(`${data.imported} meses importados com sucesso!`);
      
      // Invalidate queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics-latest"] });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao importar dados";
      setErrorMessage(message);
      setStatus("error");
      toast.error(message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Importar Dados</h2>
        <p className="text-muted-foreground">
          Importe dados financeiros da DRE via arquivo CSV.
        </p>
      </div>

      {/* DRE Import Section */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">DRE - Demonstrativo de Resultados</h3>
            <p className="text-sm text-muted-foreground">
              Arquivo CSV com dados financeiros mensais
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-4">
          <p className="font-medium mb-2">Formato esperado:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Primeira coluna: nome da métrica (ex: MRR, ARR, Lucro Líquido)</li>
            <li>Demais colunas: meses no formato "jan/22", "fev/23", etc.</li>
            <li>Valores podem usar formato BR (1.234,56) ou US (1,234.56)</li>
            <li>Valores negativos entre parênteses são aceitos: (1.234,56)</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={handleButtonClick}
            disabled={status === "reading" || status === "importing"}
            className="gap-2"
          >
            {status === "reading" || status === "importing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "reading" ? "Lendo arquivo..." : "Importando..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Selecionar arquivo CSV
              </>
            )}
          </Button>

          {fileName && status !== "idle" && (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          )}
        </div>

        {/* Result feedback */}
        {status === "success" && result && (
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-500">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.imported} meses importados com sucesso.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Período: {result.months[0]} até {result.months[result.months.length - 1]}
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Erro na importação</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Future import types */}
      <div className="border border-border rounded-lg p-6 opacity-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Clientes e Contatos</h3>
            <p className="text-sm text-muted-foreground">
              Em breve - importação de dados de clientes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}