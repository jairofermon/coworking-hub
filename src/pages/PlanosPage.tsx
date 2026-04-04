import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockPlanos as initialPlanos } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Plano } from '@/types';
import { PlanoFormDialog } from '@/components/planos/PlanoFormDialog';
import { PlanoDeleteDialog } from '@/components/planos/PlanoDeleteDialog';

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>(initialPlanos);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plano | null>(null);

  const filtered = planos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  function handleSave(plano: Plano) {
    setPlanos(prev => {
      const idx = prev.findIndex(p => p.id === plano.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = plano; return u; }
      return [...prev, plano];
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setPlanos(prev => prev.filter(p => p.id !== deleting.id));
    toast.success(`Plano "${deleting.nome}" excluído`);
    setDeleteOpen(false);
    setDeleting(null);
  }

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
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Nenhum plano encontrado.</TableCell></TableRow>}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-muted-foreground">{p.descricao}</TableCell>
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
