import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { mockClientes as initialClientes } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Cliente } from '@/types';
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog';
import { ClienteDeleteDialog } from '@/components/clientes/ClienteDeleteDialog';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  const filtered = clientes.filter(c =>
    c.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf_cnpj.includes(busca) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  function handleSave(cliente: Cliente) {
    setClientes(prev => {
      const idx = prev.findIndex(c => c.id === cliente.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = cliente; return u; }
      return [...prev, cliente];
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setClientes(prev => prev.filter(c => c.id !== deleting.id));
    toast.success(`Cliente "${deleting.nome_razao_social}" excluído`);
    setDeleteOpen(false);
    setDeleting(null);
  }

  return (
    <div className="page-container">
      <PageHeader
        titulo="Clientes"
        subtitulo="Cadastro e gerenciamento de clientes"
        acaoPrincipal={{ label: 'Novo Cliente', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }}
      />
      <FilterBar placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome / Razão Social</TableHead>
              <TableHead>CPF / CNPJ</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">{busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}</TableCell></TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome_razao_social}</TableCell>
                <TableCell className="text-muted-foreground">{c.cpf_cnpj}</TableCell>
                <TableCell>{c.especialidade}</TableCell>
                <TableCell className="text-muted-foreground">{c.telefone}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(c); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ClienteFormDialog open={formOpen} onOpenChange={setFormOpen} cliente={editing} onSave={handleSave} />
      <ClienteDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} cliente={deleting} onConfirm={handleDelete} />
    </div>
  );
}
