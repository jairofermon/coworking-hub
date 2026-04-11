import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { Plano, Contrato } from '@/types';
import { PlanoFormDialog } from '@/components/planos/PlanoFormDialog';
import { PlanoDeleteDialog } from '@/components/planos/PlanoDeleteDialog';
import { fetchPlanos, upsertPlano, deletePlano, fetchContratos } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/hooks/useAuth';

export default function PlanosPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plano | null>(null);

  async function loadData() {
    try {
      const [pl, ct] = await Promise.all([fetchPlanos(), fetchContratos()]);
      setPlanos(pl); setContratos(ct);
    } catch (e: any) { toast.error('Erro ao carregar planos: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = planos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  async function handleSave(plano: Plano) {
    try {
      const isNew = !plano.id;
      const saved = await upsertPlano(plano);
      await logAudit(isNew ? 'criar' : 'editar', 'plano', saved.id, { nome: saved.nome });
      toast.success(isNew ? 'Plano criado com sucesso!' : 'Plano atualizado.');
      await loadData();
    } catch (e: any) { toast.error('Erro ao salvar: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    const vinculados = contratos.filter(c => c.plano_id === deleting.id);
    if (vinculados.length > 0) {
      toast.error(`Não é possível excluir o plano "${deleting.nome}". Existem ${vinculados.length} contrato(s) vinculados.`);
      setDeleteOpen(false); setDeleting(null);
      return;
    }
    try {
      await deletePlano(deleting.id);
      await logAudit('excluir', 'plano', deleting.id, { nome: deleting.nome });
      toast.success(`Plano "${deleting.nome}" excluído com sucesso.`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader
        titulo="Planos"
        subtitulo={isCliente ? "Planos de locação disponíveis" : "Configure os planos de locação disponíveis"}
        acaoPrincipal={!isCliente ? { label: 'Novo Plano', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } } : undefined}
      />
      <FilterBar placeholder="Buscar plano por nome..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Horas Previstas</TableHead>
              {!isCliente && <TableHead>Contratos Vinculados</TableHead>}
              <TableHead>Status</TableHead>
              {!isCliente && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={isCliente ? 4 : 6}>
                  <EmptyState icon={ListChecks} titulo="Nenhum plano encontrado" descricao={busca ? 'Tente alterar os termos de busca.' : 'Nenhum plano disponível.'} />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const ctVinculados = contratos.filter(c => c.plano_id === p.id).length;
              return (
                <TableRow key={p.id} className={!p.ativo ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.descricao || '—'}</TableCell>
                  <TableCell>{p.horas_previstas > 0 ? `${p.horas_previstas}h` : '—'}</TableCell>
                  {!isCliente && <TableCell className="text-muted-foreground">{ctVinculados}</TableCell>}
                  <TableCell><StatusBadge status={p.ativo} /></TableCell>
                  {!isCliente && (
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
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      {!isCliente && (
        <>
          <PlanoFormDialog open={formOpen} onOpenChange={setFormOpen} plano={editing} onSave={handleSave} />
          <PlanoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} plano={deleting} onConfirm={handleDelete} />
        </>
      )}
    </div>
  );
}
