import { useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for users
const mockUsers = [
  {
    id: "1",
    name: "Felipe Hotz",
    email: "felipe@comunica.in",
    role: "Owner",
    joinedDate: "15 Mai, 2025",
    usage: "483 créditos",
    totalUsage: "20613 créditos",
  },
  {
    id: "2",
    name: "Luiz Campos",
    email: "luiz.campos@comunica.in",
    role: "Colaborador",
    joinedDate: "10 Nov, 2025",
    usage: "-",
    totalUsage: "-",
  },
  {
    id: "3",
    name: "Cristiano Mattos Veiga",
    email: "cristiano@comunica.in",
    role: "Colaborador",
    joinedDate: "31 Out, 2025",
    usage: "-",
    totalUsage: "-",
  },
  {
    id: "4",
    name: "Luiya Iglesias",
    email: "luiya@comunica.in",
    role: "Colaborador",
    joinedDate: "16 Out, 2025",
    usage: "60 créditos",
    totalUsage: "60 créditos",
  },
  {
    id: "5",
    name: "Kayo Lima",
    email: "kayo@comunica.in",
    role: "Colaborador",
    joinedDate: "6 Out, 2025",
    usage: "305 créditos",
    totalUsage: "305 créditos",
  },
];

export function UsersSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Usuários</h2>
        <p className="text-muted-foreground text-sm">
          Gerencie os usuários e permissões do workspace.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
          <TabsTrigger
            value="all"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Todos
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Convites
          </TabsTrigger>
          <TabsTrigger
            value="collaborators"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Colaboradores
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm">
          Convidar
        </Button>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="font-medium">Nome</TableHead>
              <TableHead className="font-medium">E-mail</TableHead>
              <TableHead className="font-medium">Perfil</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{user.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{user.role}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Alterar perfil</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
