import { useState, useMemo } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  nome_fantasia: string;
}

interface CustomerDropdownCompactProps {
  customers: Customer[];
  onValueChange: (customerId: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function CustomerDropdownCompact({
  customers,
  onValueChange,
  placeholder = "Selecione...",
  isLoading = false,
}: CustomerDropdownCompactProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchValue.trim()) return customers;
    return customers.filter((c) =>
      c.nome_fantasia.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [customers, searchValue]);

  const handleSelect = (customerId: string) => {
    onValueChange(customerId);
    setOpen(false);
    setSearchValue("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Vinculando...
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-between gap-2 w-full h-8 px-3 rounded-md border border-white/15 bg-transparent hover:bg-muted/50 hover:border-white/25 transition-colors text-left text-xs text-muted-foreground">
          <span>{placeholder}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 bg-popover border-border z-50" 
        align="start"
        sideOffset={4}
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8 bg-secondary border-border h-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nenhum cliente encontrado
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer.id)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <div className="h-6 w-6 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {getInitials(customer.nome_fantasia)}
                  </span>
                </div>
                <span className="text-sm truncate flex-1">{customer.nome_fantasia}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
