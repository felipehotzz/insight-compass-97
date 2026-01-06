import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Globe } from "lucide-react";
import { toast } from "sonner";

interface CustomerDomainsSectionProps {
  customerId: string;
}

export const CustomerDomainsSection = ({ customerId }: CustomerDomainsSectionProps) => {
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: domains, isLoading } = useQuery({
    queryKey: ["customer-domains", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_domains")
        .select("*")
        .eq("customer_id", customerId)
        .order("domain");
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const cleanDomain = domain.toLowerCase().trim().replace(/^@/, "");
      const { error } = await supabase.from("customer_domains").insert({
        customer_id: customerId,
        domain: cleanDomain,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-domains", customerId] });
      setNewDomain("");
      setIsAdding(false);
      toast.success("Domínio adicionado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar domínio: " + error.message);
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from("customer_domains")
        .delete()
        .eq("id", domainId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-domains", customerId] });
      toast.success("Domínio removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover domínio: " + error.message);
    },
  });

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    addDomainMutation.mutate(newDomain);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Domínios de E-mail</h3>
        </div>
        {!isAdding && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setIsAdding(true)}>
            <Plus className="h-3 w-3" />
            Adicionar
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Domínios usados para vincular tickets de suporte automaticamente ao cliente.
      </p>

      {isAdding && (
        <form onSubmit={handleAddDomain} className="flex gap-2">
          <Input
            placeholder="exemplo.com.br"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="h-8 text-sm flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8" disabled={addDomainMutation.isPending}>
            {addDomainMutation.isPending ? "..." : "Salvar"}
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setIsAdding(false)}>
            Cancelar
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : domains && domains.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <Badge key={domain.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              <span className="text-xs">@{domain.domain}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => deleteDomainMutation.mutate(domain.id)}
                disabled={deleteDomainMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhum domínio cadastrado</p>
      )}
    </div>
  );
};
