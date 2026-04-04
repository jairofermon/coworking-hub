import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockFormasPagamento as initialFormas } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormaPagamento } from '@/types';
import { FormaPagamentoFormDialog } from '@/components/formas-pagamento/FormaPagamentoFormDialog';
import { FormaPagamentoDeleteDialog } from '@/components/formas-pagamento/FormaPagamentoDeleteDialog';

export default function FormasPagamentoPage() {
  const [formas, setFormas] = useState<FormaPagamento[]>(initialFormas);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<FormaPagamento | null>(null);

  const filtered = formas.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));

  function handleSave(forma: FormaPagamento) {
    setFormas(prev => {
      const idx = prev.findIndex(f => f.id === forma.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = forma; return u; }
      return [...prev, forma];
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setFormas(prev => prev.filter(f => f.id !== deleting.id));
    toast.success(`"${deleting.nome}" excluída`);
    setDeleteOpen(false);
    setDeleting(null);
  }

  return (
    <div className="page-container">
      <PageHeader titulo="Formas de Pagamento" subtitulo="Configure as formas de pagamento aceitas" acaoPrincipal={{ label: 'Nova Forma', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }} />
      <FilterBar placeholder="Buscar forma de pagamento..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Dias p/ Recebimento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Parcelamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhuma forma encontrada.</TableCell></TableRow>}
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.taxa_percentual}%</TableCell>
                <TableCell>{f.dias_recebimento === 0 ? 'Imediato' : `${f.dias_recebimento} dias`}</TableCell>
                <TableCell className="text-muted-foreground">{f.tipo_recebimento}</TableCell>
                <TableCell>{f.permite_parcelamento ? 'Sim' : 'Não'}</TableCell>
                <TableCell><StatusBadge status={f.ativo} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(f); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(f); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <FormaPagamentoFormDialog open={formOpen} onOpenChange={setFormOpen} forma={editing} onSave={handleSave} />
      <FormaPagamentoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} forma={deleting} onConfirm={handleDelete} />
    </div>
  );
}
