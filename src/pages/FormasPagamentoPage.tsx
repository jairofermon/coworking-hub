import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { FormaPagamento, Contrato } from '@/types';
import { FormaPagamentoFormDialog } from '@/components/formas-pagamento/FormaPagamentoFormDialog';
import { FormaPagamentoDeleteDialog } from '@/components/formas-pagamento/FormaPagamentoDeleteDialog';
import { fetchFormasPagamento, upsertFormaPagamento, deleteFormaPagamento, fetchContratos } from '@/lib/api';
import { logAudit } from '@/lib/audit';

export default function FormasPagamentoPage() {
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<FormaPagamento | null>(null);

  async function loadData() {
    try {
      const [fp, ct] = await Promise.all([fetchFormasPagamento(), fetchContratos()]);
      setFormas(fp); setContratos(ct);
    } catch (e: any) { toast.error('Erro ao carregar: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = formas.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));

  async function handleSave(forma: FormaPagamento) {
    try {
      const isNew = !forma.id;
      const saved = await upsertFormaPagamento(forma);
      await logAudit(isNew ? 'criar' : 'editar', 'forma_pagamento', saved.id, { nome: saved.nome });
      toast.success(isNew ? 'Forma de pagamento criada!' : 'Forma de pagamento atualizada.');
      await loadData();
    } catch (e: any) { toast.error('Erro ao salvar: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    const vinculados = contratos.filter(c => c.forma_pagamento_id === deleting.id);
    if (vinculados.length > 0) {
      toast.error(`Não é possível excluir "${deleting.nome}". Existem ${vinculados.length} contrato(s) vinculados.`);
      setDeleteOpen(false); setDeleting(null);
      return;
    }
    try {
      await deleteFormaPagamento(deleting.id);
      await logAudit('excluir', 'forma_pagamento', deleting.id, { nome: deleting.nome });
      toast.success(`"${deleting.nome}" excluída com sucesso.`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
  }

  if (loading) return <LoadingState />;

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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState icon={CreditCard} titulo="Nenhuma forma de pagamento encontrada" descricao={busca ? 'Tente alterar os termos de busca.' : 'Clique em "Nova Forma" para criar.'} />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((f) => (
              <TableRow key={f.id} className={!f.ativo ? 'opacity-60' : ''}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.taxa_percentual}%</TableCell>
                <TableCell>{f.dias_recebimento === 0 ? 'Imediato' : `${f.dias_recebimento} dia(s)`}</TableCell>
                <TableCell className="text-muted-foreground">{f.tipo_recebimento || '—'}</TableCell>
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
