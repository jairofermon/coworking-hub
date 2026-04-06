import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Cliente } from '@/types';
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog';
import { ClienteDeleteDialog } from '@/components/clientes/ClienteDeleteDialog';
import { fetchClientes, upsertCliente, deleteCliente } from '@/lib/api';
import { logAudit } from '@/lib/audit';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  async function loadData() {
    try { setClientes(await fetchClientes()); } catch (e: any) { toast.error('Erro: ' + e.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = clientes.filter(c =>
    c.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf_cnpj.includes(busca) || c.email.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleSave(cliente: Cliente) {
    try { await upsertCliente(cliente); await loadData(); } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCliente(deleting.id);
      toast.success(`Cliente "${deleting.nome_razao_social}" excluído`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Clientes" subtitulo="Cadastro e gerenciamento de clientes" acaoPrincipal={{ label: 'Novo Cliente', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }} />
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
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">{busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}</TableCell></TableRow>}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome_razao_social}</TableCell>
                <TableCell className="text-muted-foreground">{c.cpf_cnpj}</TableCell>
                <TableCell>{c.especialidade}</TableCell>
                <TableCell className="text-muted-foreground">{c.telefone}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
