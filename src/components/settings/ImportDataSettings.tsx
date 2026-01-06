import { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ImportStatus = "idle" | "reading" | "importing" | "success" | "error";

interface ImportResult {
  imported?: number;
  months?: string[];
  customersCreated?: number;
  customersUpdated?: number;
  contractsCreated?: number;
  contractsUpdated?: number;
  totalCustomers?: number;
  errors?: string[];
  importId?: string;
}

interface ImportHistoryItem {
  id: string;
  import_type: string;
  file_name: string;
  customers_created: number;
  customers_updated: number;
  contracts_created: number;
  contracts_updated: number;
  records_imported: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function ImportDataSettings() {
  const [dreStatus, setDreStatus] = useState<ImportStatus>("idle");
  const [dreFileName, setDreFileName] = useState<string>("");
  const [dreResult, setDreResult] = useState<ImportResult | null>(null);
  const [dreErrorMessage, setDreErrorMessage] = useState<string>("");
  const dreFileInputRef = useRef<HTMLInputElement>(null);

  const [customersStatus, setCustomersStatus] = useState<ImportStatus>("idle");
  const [customersFileName, setCustomersFileName] = useState<string>("");
  const [customersResult, setCustomersResult] = useState<ImportResult | null>(null);
  const [customersErrorMessage, setCustomersErrorMessage] = useState<string>("");
  const customersFileInputRef = useRef<HTMLInputElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importToDelete, setImportToDelete] = useState<ImportHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch import history
  const { data: importHistory, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["import-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ImportHistoryItem[];
    },
  });

  const handleDeleteImport = async () => {
    if (!importToDelete) return;

    setIsDeleting(true);
    try {
      // Delete contracts linked to this import
      const { error: contractsError } = await supabase
        .from("contracts")
        .delete()
        .eq("import_id", importToDelete.id);

      if (contractsError) {
        console.error("Error deleting contracts:", contractsError);
      }

      // Delete customers linked to this import (only those without other contracts)
      const { error: customersError } = await supabase
        .from("customers")
        .delete()
        .eq("import_id", importToDelete.id);

      if (customersError) {
        console.error("Error deleting customers:", customersError);
      }

      // Delete the import history record
      const { error: historyError } = await supabase
        .from("import_history")
        .delete()
        .eq("id", importToDelete.id);

      if (historyError) throw historyError;

      toast.success("Importação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["import-history"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-metrics"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir importação";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setImportToDelete(null);
    }
  };

  const handleDreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDreFileName(file.name);
    setDreStatus("reading");
    setDreResult(null);
    setDreErrorMessage("");

    try {
      const text = await file.text();
      setDreStatus("importing");

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

      setDreResult(data);
      setDreStatus("success");
      toast.success(`${data.imported} meses importados com sucesso!`);
      
      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["financial-metrics-latest"] });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao importar dados";
      setDreErrorMessage(message);
      setDreStatus("error");
      toast.error(message);
    }

    if (dreFileInputRef.current) {
      dreFileInputRef.current.value = "";
    }
  };

  const handleCustomersFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomersFileName(file.name);
    setCustomersStatus("reading");
    setCustomersResult(null);
    setCustomersErrorMessage("");

    try {
      const text = await file.text();
      setCustomersStatus("importing");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar logado para importar dados");
      }

      const { data, error } = await supabase.functions.invoke("import-customers-contracts", {
        body: { 
          csvContent: text,
          fileName: file.name,
          userId: sessionData.session.user.id
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setCustomersResult(data);
      setCustomersStatus("success");
      toast.success(`${data.totalCustomers} clientes e ${data.contractsCreated + data.contractsUpdated} contratos processados!`);
      
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-metrics"] });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao importar dados";
      setCustomersErrorMessage(message);
      setCustomersStatus("error");
      toast.error(message);
    }

    if (customersFileInputRef.current) {
      customersFileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Importar Dados</h2>
        <p className="text-muted-foreground">
          Importe dados financeiros e de clientes via arquivo CSV.
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
            ref={dreFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleDreFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={() => dreFileInputRef.current?.click()}
            disabled={dreStatus === "reading" || dreStatus === "importing"}
            className="gap-2"
          >
            {dreStatus === "reading" || dreStatus === "importing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {dreStatus === "reading" ? "Lendo arquivo..." : "Importando..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Selecionar arquivo CSV
              </>
            )}
          </Button>

          {dreFileName && dreStatus !== "idle" && (
            <span className="text-sm text-muted-foreground">{dreFileName}</span>
          )}
        </div>

        {dreStatus === "success" && dreResult && (
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-500">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {dreResult.imported} meses importados com sucesso.
              </p>
              {dreResult.months && dreResult.months.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Período: {dreResult.months[0]} até {dreResult.months[dreResult.months.length - 1]}
                </p>
              )}
            </div>
          </div>
        )}

        {dreStatus === "error" && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Erro na importação</p>
              <p className="text-sm text-muted-foreground mt-1">{dreErrorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Customers and Contracts Import Section */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Clientes e Contratos</h3>
            <p className="text-sm text-muted-foreground">
              Arquivo CSV com dados de clientes e contratos
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-4">
          <p className="font-medium mb-2">Formato esperado:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Separador: ponto e vírgula (;)</li>
            <li>Colunas principais: ID Financeiro, Status cliente, Id cliente (CNPJ), Razão Social, Nome Fantasia</li>
            <li>Dados de contrato: MRR, Vigência inicial/final, Status do contrato, etc.</li>
            <li>Clientes são agrupados por CNPJ único</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={customersFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCustomersFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={() => customersFileInputRef.current?.click()}
            disabled={customersStatus === "reading" || customersStatus === "importing"}
            className="gap-2"
          >
            {customersStatus === "reading" || customersStatus === "importing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {customersStatus === "reading" ? "Lendo arquivo..." : "Importando..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Selecionar arquivo CSV
              </>
            )}
          </Button>

          {customersFileName && customersStatus !== "idle" && (
            <span className="text-sm text-muted-foreground">{customersFileName}</span>
          )}
        </div>

        {customersStatus === "success" && customersResult && (
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-500">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">{customersResult.totalCustomers}</span> clientes processados 
                ({customersResult.customersCreated} novos, {customersResult.customersUpdated} atualizados)
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{(customersResult.contractsCreated || 0) + (customersResult.contractsUpdated || 0)}</span> contratos processados
                ({customersResult.contractsCreated} novos, {customersResult.contractsUpdated} atualizados)
              </p>
              {customersResult.errors && customersResult.errors.length > 0 && (
                <p className="text-xs text-amber-500 mt-2">
                  ⚠️ {customersResult.errors.length} avisos durante importação
                </p>
              )}
            </div>
          </div>
        )}

        {customersStatus === "error" && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Erro na importação</p>
              <p className="text-sm text-muted-foreground mt-1">{customersErrorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Import History Section */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Histórico de Importações</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie suas importações anteriores
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchHistory()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : importHistory && importHistory.length > 0 ? (
          <div className="space-y-2">
            {importHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.file_name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.status === "completed"
                          ? "bg-green-500/20 text-green-500"
                          : item.status === "failed"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-amber-500/20 text-amber-500"
                      }`}
                    >
                      {item.status === "completed" ? "Concluído" : item.status === "failed" ? "Falhou" : "Processando"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {item.import_type === "customers_contracts" && (
                      <span className="ml-2">
                        • {item.customers_created + item.customers_updated} clientes, {item.contracts_created + item.contracts_updated} contratos
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setImportToDelete(item);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma importação registrada</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir todos os clientes e contratos criados por esta importação.
              {importToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  Arquivo: {importToDelete.file_name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImport}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}