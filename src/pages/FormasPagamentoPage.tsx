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
import { FormaPagamento } from '@/types';
import { FormaPagamentoFormDialog } from '@/components/formas-pagamento/FormaPagamentoFormDialog';
import { FormaPagamentoDeleteDialog } from '@/components/formas-pagamento/FormaPagamentoDeleteDialog';
import { fetchFormasPagamento, upsertFormaPagamento, deleteFormaPagamento } from '@/lib/api';
import { logAudit } from '@/lib/audit';

export default function FormasPagamentoPage() {
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<FormaPagamento | null>(null);

  async function loadData() {
    try { setFormas(await fetchFormasPagamento()); } catch (e: any) { toast.error('Erro: ' + e.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = formas.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));

  async function handleSave(forma: FormaPagamento) {
    try {
      const isNew = !forma.id;
      const saved = await upsertFormaPagamento(forma);
      await logAudit(isNew ? 'criar' : 'editar', 'forma_pagamento', saved.id, { nome: saved.nome });
      await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteFormaPagamento(deleting.id);
      toast.success(`"${deleting.nome}" excluída`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

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
