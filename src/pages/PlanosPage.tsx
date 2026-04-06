import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Plano } from '@/types';
import { PlanoFormDialog } from '@/components/planos/PlanoFormDialog';
import { PlanoDeleteDialog } from '@/components/planos/PlanoDeleteDialog';
import { fetchPlanos, upsertPlano, deletePlano } from '@/lib/api';
import { logAudit } from '@/lib/audit';

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plano | null>(null);

  async function loadData() {
    try { setPlanos(await fetchPlanos()); } catch (e: any) { toast.error('Erro: ' + e.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = planos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  async function handleSave(plano: Plano) {
    try {
      const isNew = !plano.id;
      const saved = await upsertPlano(plano);
      await logAudit(isNew ? 'criar' : 'editar', 'plano', saved.id, { nome: saved.nome });
      await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deletePlano(deleting.id);
      toast.success(`Plano "${deleting.nome}" excluído`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Planos" subtitulo="Configure os planos de locação disponíveis" acaoPrincipal={{ label: 'Novo Plano', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }} />
      <FilterBar placeholder="Buscar plano..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor Previsto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum plano encontrado.</TableCell></TableRow>}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-muted-foreground">{p.descricao}</TableCell>
                <TableCell>R$ {p.valor_previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><StatusBadge status={p.ativo} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(p); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <PlanoFormDialog open={formOpen} onOpenChange={setFormOpen} plano={editing} onSave={handleSave} />
      <PlanoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} plano={deleting} onConfirm={handleDelete} />
    </div>
  );
}
