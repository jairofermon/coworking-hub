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
import { Plano, Contrato, Sala } from '@/types';
import { PlanoFormDialog } from '@/components/planos/PlanoFormDialog';
import { PlanoDeleteDialog } from '@/components/planos/PlanoDeleteDialog';
import { fetchPlanos, upsertPlano, deletePlano, fetchContratos, fetchSalas, fetchPlanoSalas, savePlanoSalas } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/hooks/useAuth';

export default function PlanosPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [planoSalas, setPlanoSalas] = useState<{ plano_id: string; sala_id: string }[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plano | null>(null);

  async function loadData() {
    try {
      const [pl, ct, sl, ps] = await Promise.all([fetchPlanos(), fetchContratos(), fetchSalas(), fetchPlanoSalas()]);
      setPlanos(pl); setContratos(ct); setSalas(sl); setPlanoSalas(ps);
    } catch (e: any) { toast.error('Erro ao carregar planos: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = planos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  function salasDoPlano(planoId: string): Sala[] {
    const ids = planoSalas.filter(ps => ps.plano_id === planoId).map(ps => ps.sala_id);
    return salas.filter(s => ids.includes(s.id));
  }

  async function handleSave(plano: Plano, salaIds: string[]) {
    try {
      const isNew = !plano.id;
      const saved = await upsertPlano(plano);
      await savePlanoSalas(saved.id, salaIds);
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
              <TableHead>Valor Previsto</TableHead>
              <TableHead>Horas Previstas</TableHead>
              <TableHead>Salas Disponíveis</TableHead>
              {!isCliente && <TableHead>Contratos Vinculados</TableHead>}
              <TableHead>Status</TableHead>
              {!isCliente && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={isCliente ? 6 : 8}>
                  <EmptyState icon={ListChecks} titulo="Nenhum plano encontrado" descricao={busca ? 'Tente alterar os termos de busca.' : 'Nenhum plano disponível.'} />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const ctVinculados = contratos.filter(c => c.plano_id === p.id).length;
              const planoSalasNomes = salasDoPlano(p.id).map(s => s.nome);
              return (
                <TableRow key={p.id} className={!p.ativo ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.descricao || '—'}</TableCell>
                  <TableCell>{formatCurrency(p.valor_previsto)}</TableCell>
                  <TableCell>{p.horas_previstas > 0 ? `${p.horas_previstas}h` : '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {planoSalasNomes.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {planoSalasNomes.map((n, i) => <span key={i}>{n}</span>)}
                      </div>
                    ) : '—'}
                  </TableCell>
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
          <PlanoFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            plano={editing}
            salas={salas}
            salaIdsIniciais={editing ? planoSalas.filter(ps => ps.plano_id === editing.id).map(ps => ps.sala_id) : []}
            onSave={handleSave}
          />
          <PlanoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} plano={deleting} onConfirm={handleDelete} />
        </>
      )}
    </div>
  );
}
