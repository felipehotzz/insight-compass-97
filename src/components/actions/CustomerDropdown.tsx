import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
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

interface CustomerDropdownProps {
  customers: Customer[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CustomerDropdown({
  customers,
  value,
  onValueChange,
  placeholder = "Selecionar...",
}: CustomerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchValue.trim()) return customers;
    return customers.filter((c) =>
      c.nome_fantasia.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [customers, searchValue]);

  const selectedCustomer = customers.find((c) => c.nome_fantasia === value);

  const handleSelect = (customerName: string) => {
    onValueChange(customerName);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 min-w-[160px] border-none bg-transparent hover:bg-secondary/50 h-8 px-2 rounded-md transition-colors text-left">
          {selectedCustomer ? (
            <>
              <div className="h-5 w-5 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-medium text-muted-foreground">
                  {getInitials(selectedCustomer.nome_fantasia)}
                </span>
              </div>
              <span className="text-sm truncate">{selectedCustomer.nome_fantasia}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 bg-popover border-border z-50" 
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
        <div className="max-h-64 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nenhum cliente encontrado
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer.nome_fantasia)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors text-left ${
                  value === customer.nome_fantasia ? "bg-secondary/70" : ""
                }`}
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
