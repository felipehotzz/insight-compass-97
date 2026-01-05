import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const customers = [
  { id: 1, name: "Grendene", value: 300000 },
  { id: 2, name: "Syngenta", value: 180000 },
  { id: 3, name: "CBMM", value: 117000 },
  { id: 4, name: "Alpargatas", value: 96000 },
  { id: 5, name: "SESC Nacional", value: 86400 },
  { id: 6, name: "Metro BH", value: 67200 },
  { id: 7, name: "Softplan", value: 57820 },
  { id: 8, name: "Eucatex", value: 42000 },
  { id: 9, name: "Caixa Consórcios", value: 33600 },
  { id: 10, name: "CJ do Brasil", value: 29964 },
];

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSelectCustomer = (customerId: number, customerName: string) => {
    setOpen(false);
    setSearchValue("");
    navigate(`/customer-detail?id=${customerId}&name=${encodeURIComponent(customerName)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6">
      <h1 className="page-title">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-64 justify-start gap-2 bg-secondary/50 border-border hover:bg-secondary"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Buscar cliente...</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <Command>
              <CommandInput
                placeholder="Digite o nome do cliente..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup heading="Clientes">
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(searchValue.toLowerCase())
                    )
                    .map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => handleSelectCustomer(customer.id, customer.name)}
                        className="cursor-pointer"
                      >
                        <span>{customer.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          R$ {customer.value.toLocaleString("pt-BR")}
                        </span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Actions */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
