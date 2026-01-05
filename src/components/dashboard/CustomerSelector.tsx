import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { allCustomers } from "@/data/mockData";

interface CustomerSelectorProps {
  currentCustomerName: string;
  currentCustomerLogo?: string;
}

export function CustomerSelector({ currentCustomerName, currentCustomerLogo }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const filteredCustomers = allCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelectCustomer = (customerId: number, customerName: string) => {
    setOpen(false);
    setSearchValue("");
    navigate(`/customer-detail?id=${customerId}&name=${encodeURIComponent(customerName)}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {/* Logo placeholder */}
          <div className="h-9 w-9 rounded-md bg-secondary border border-border flex items-center justify-center overflow-hidden">
            {currentCustomerLogo ? (
              <img src={currentCustomerLogo} alt={currentCustomerName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {currentCustomerName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="page-title">{currentCustomerName}</h1>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-popover border-border" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8 bg-secondary border-border"
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
                onClick={() => handleSelectCustomer(customer.id, customer.name)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
              >
                {/* Logo placeholder */}
                <div className="h-7 w-7 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {customer.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{customer.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {customer.value.toLocaleString("pt-BR")}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
