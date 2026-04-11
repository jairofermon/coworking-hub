import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { AlertBanner } from '@/components/AlertBanner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Contrato, Cliente, Sala, Plano, FormaPagamento, Agendamento } from '@/types';
import { ContratoFormDialog } from '@/components/contratos/ContratoFormDialog';
import { ContratoDeleteDialog } from '@/components/contratos/ContratoDeleteDialog';
import { fetchContratos, upsertContrato, deleteContrato, fetchClientes, fetchSalas, fetchPlanos, fetchFormasPagamento, inactivateExpiredContracts, fetchAgendamentos } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { generateContratoPdf } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'encerrado', label: 'Encerrados' },
  { value: 'cancelado', label: 'Cancelados' },
];

function daysUntilExpiry(dataFim: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const fim = new Date(dataFim + 'T00:00:00');
  return Math.ceil((fim.getTime() - now.getTime()) / 86400000);
}

export default function ContratosPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;
  const clienteId = user?.clienteId;

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contrato | null>(null);
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<'codigo' | 'data_inicio' | 'valor_total'>('data_inicio');
  const [sortAsc, setSortAsc] = useState(false);

  async function loadData() {
    try {
      await inactivateExpiredContracts().catch(() => {});
      const [ct, cl, sl, pl, fp, ag] = await Promise.all([fetchContratos(), fetchClientes(), fetchSalas(), fetchPlanos(), fetchFormasPagamento(), fetchAgendamentos()]);
      setContratos(ct); setClientes(cl); setSalas(sl); setPlanos(pl); setFormas(fp); setAgendamentos(ag);
    } catch (e: any) { toast.error('Erro ao carregar contratos: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let result = contratos.filter(ct => {
      // Client can only see their own contracts
      if (isCliente && clienteId && ct.cliente_id !== clienteId) return false;
      if (filtroStatus !== 'all' && ct.status !== filtroStatus) return false;
      if (!busca) return true;
      const q = busca.toLowerCase();
      const cliente = clientes.find(c => c.id === ct.cliente_id);
      return (cliente?.nome_razao_social.toLowerCase().includes(q)) || ct.codigo?.toLowerCase().includes(q);
    });
    result.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === 'valor_total') { va = a.valor_total; vb = b.valor_total; }
      else { va = a[sortField] || ''; vb = b[sortField] || ''; }
      if (typeof va === 'number') return sortAsc ? va - (vb as number) : (vb as number) - va;
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return result;
  }, [contratos, busca, filtroStatus, clientes, sortField, sortAsc, isCliente, clienteId]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [busca, filtroStatus]);

  const contratosProximosVencimento = useMemo(() => {
    const base = isCliente && clienteId ? contratos.filter(c => c.cliente_id === clienteId) : contratos;
    return base.filter(c => c.status === 'ativo' && daysUntilExpiry(c.data_fim) <= 15 && daysUntilExpiry(c.data_fim) >= 0);
  }, [contratos, isCliente, clienteId]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  async function handleSave(contrato: Contrato) {
    try {
      const isNew = !contrato.id;
      const saved = await upsertContrato(contrato);
      await logAudit(isNew ? 'criar' : 'editar', 'contrato', saved.id, { codigo: saved.codigo });
      toast.success(isNew ? 'Contrato criado com sucesso!' : 'Contrato atualizado.');
      await loadData();
    } catch (e: any) { toast.error('Erro ao salvar: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    const agsVinculados = agendamentos.filter(a => a.contrato_id === deleting.id);
    if (agsVinculados.length > 0) {
      toast.error(`Não é possível excluir o contrato "${deleting.codigo}". Existem ${agsVinculados.length} agendamento(s) vinculados.`);
      setDeleteOpen(false); setDeleting(null);
      return;
    }
    try {
      await deleteContrato(deleting.id);
      await logAudit('excluir', 'contrato', deleting.id, { codigo: deleting.codigo });
      toast.success(`Contrato "${deleting.codigo}" excluído com sucesso.`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
  }

  if (loading) return <LoadingState />;

  const SortableHead = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="page-container">
      <PageHeader
        titulo="Contratos"
        subtitulo={isCliente ? "Visualize seus contratos" : "Controle de contratos de locação"}
        acaoPrincipal={!isCliente ? { label: 'Novo Contrato', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } } : undefined}
      />

      {contratosProximosVencimento.length > 0 && (
        <AlertBanner type="warning">
          <strong>{contratosProximosVencimento.length} contrato(s)</strong> com vencimento nos próximos 15 dias:{' '}
          {contratosProximosVencimento.map(c => {
            const dias = daysUntilExpiry(c.data_fim);
            return <span key={c.id} className="font-medium">{c.codigo} ({dias === 0 ? 'hoje' : `${dias}d`})</span>;
          }).reduce<React.ReactNode[]>((prev, curr, i) => i === 0 ? [curr] : [...prev, ', ', curr], [])}
        </AlertBanner>
      )}

      <FilterBar placeholder="Buscar por cliente ou código..." value={busca} onChange={setBusca}>
        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => (
            <Button key={f.value} variant={filtroStatus === f.value ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setFiltroStatus(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
      </FilterBar>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="codigo">Código</SortableHead>
              {!isCliente && <TableHead>Cliente</TableHead>}
              <TableHead>Sala</TableHead>
              <TableHead>Plano</TableHead>
              <SortableHead field="valor_total">Valor Total</SortableHead>
              <TableHead>Valor Líquido</TableHead>
              <SortableHead field="data_inicio">Período</SortableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
              {!isCliente && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={isCliente ? 8 : 10}>
                  <EmptyState icon={FileText} titulo="Nenhum contrato encontrado" descricao={busca ? 'Tente alterar os termos de busca.' : isCliente ? 'Você ainda não possui contratos.' : 'Clique em "Novo Contrato" para começar.'} />
                </TableCell>
              </TableRow>
            )}
            {paginated.map((ct) => {
              const cliente = clientes.find(c => c.id === ct.cliente_id);
              const sala = salas.find(s => s.id === ct.sala_id);
              const plano = planos.find(p => p.id === ct.plano_id);
              const dias = ct.status === 'ativo' ? daysUntilExpiry(ct.data_fim) : null;
              const nearExpiry = dias !== null && dias <= 15 && dias >= 0;
              return (
                <TableRow key={ct.id} className={nearExpiry ? 'bg-warning/5' : ''}>
                  <TableCell className="font-mono text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      {ct.codigo}
                      {nearExpiry && (
                        <Tooltip>
                          <TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-warning" /></TooltipTrigger>
                          <TooltipContent>Vence {dias === 0 ? 'hoje' : `em ${dias} dia(s)`}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  {!isCliente && <TableCell className="font-medium">{cliente?.nome_razao_social}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                      {sala?.nome}
                    </div>
                  </TableCell>
                  <TableCell>{plano?.nome}</TableCell>
                  <TableCell>R$ {ct.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>R$ {ct.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(ct.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(ct.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><StatusBadge status={ct.status} /></TableCell>
                  <TableCell />
                  {!isCliente && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(ct); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const cl = clientes.find(c => c.id === ct.cliente_id);
                            const sl = salas.find(s => s.id === ct.sala_id);
                            const pl = planos.find(p => p.id === ct.plano_id);
                            const fp = formas.find(f => f.id === ct.forma_pagamento_id);
                            if (cl && sl && pl && fp) generateContratoPdf(ct, cl, sl, pl, fp);
                          }}><FileText className="mr-2 h-4 w-4" /> Gerar PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(ct); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <TablePagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        )}
      </Card>
      {!isCliente && (
        <>
          <ContratoFormDialog open={formOpen} onOpenChange={setFormOpen} contrato={editing} onSave={handleSave} clientes={clientes} salas={salas} planos={planos} formasPagamento={formas} />
          <ContratoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
        </>
      )}
    </div>
  );
}

// Re-export TablePagination usage
import { TablePagination } from '@/components/TablePagination';
