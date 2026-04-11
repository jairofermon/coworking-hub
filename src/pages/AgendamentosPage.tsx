import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { TablePagination } from '@/components/TablePagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, LogIn, LogOut, CalendarDays, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Agendamento, Cliente, Sala, Contrato, Plano, DisponibilidadeSala } from '@/types';
import { AgendamentoFormDialog } from '@/components/agendamentos/AgendamentoFormDialog';
import { AgendamentoDeleteDialog } from '@/components/agendamentos/AgendamentoDeleteDialog';
import { fetchAgendamentos, upsertAgendamento, deleteAgendamento, fetchClientes, fetchSalas, fetchContratos, fetchPlanos, fetchDisponibilidades, checkinAgendamento, checkoutAgendamento } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { generateAgendamentoPdf } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'cancelado', label: 'Cancelados' },
];

export default function AgendamentosPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;
  const clienteId = user?.clienteId;

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeSala[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Agendamento | null>(null);
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [filtroSala, setFiltroSala] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  async function loadData() {
    try {
      const [ag, cl, sl, ct, pl, dp] = await Promise.all([fetchAgendamentos(), fetchClientes(), fetchSalas(), fetchContratos(), fetchPlanos(), fetchDisponibilidades()]);
      setAgendamentos(ag); setClientes(cl); setSalas(sl); setContratos(ct); setPlanos(pl); setDisponibilidades(dp);
    } catch (e: any) { toast.error('Erro ao carregar agendamentos: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    return agendamentos
      .filter(ag => {
        // Client can only see their own
        if (isCliente && clienteId && ag.cliente_id !== clienteId) return false;
        if (filtroStatus !== 'all' && ag.status !== filtroStatus) return false;
        if (filtroSala !== 'all' && ag.sala_id !== filtroSala) return false;
        if (!busca) return true;
        const q = busca.toLowerCase();
        const cliente = clientes.find(c => c.id === ag.cliente_id);
        const sala = salas.find(s => s.id === ag.sala_id);
        return (cliente?.nome_razao_social.toLowerCase().includes(q)) || (sala?.nome.toLowerCase().includes(q)) || ag.data.includes(busca);
      })
      .sort((a, b) => b.data.localeCompare(a.data) || b.hora_inicio.localeCompare(a.hora_inicio));
  }, [agendamentos, busca, filtroStatus, filtroSala, clientes, salas, isCliente, clienteId]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [busca, filtroStatus, filtroSala]);

  // For client creating agendamento, filter clientes to only themselves
  const clientesForForm = isCliente && clienteId ? clientes.filter(c => c.id === clienteId) : clientes;
  // For client, filter contratos to only theirs
  const contratosForForm = isCliente && clienteId ? contratos.filter(c => c.cliente_id === clienteId) : contratos;

  async function handleSave(ag: Agendamento) {
    try {
      // Client can only create for themselves
      if (isCliente && clienteId && ag.cliente_id !== clienteId) {
        toast.error('Você só pode criar agendamentos para a sua conta.');
        return;
      }
      const isNew = !ag.id;
      // Client cannot edit existing
      if (isCliente && !isNew) {
        toast.error('Você não pode editar agendamentos.');
        return;
      }
      const saved = await upsertAgendamento(ag);
      await logAudit(isNew ? 'criar' : 'editar', 'agendamento', saved.id, { data: saved.data, hora: saved.hora_inicio });
      toast.success(isNew ? 'Agendamento criado com sucesso!' : 'Agendamento atualizado.');
      await loadData();
    } catch (e: any) { toast.error('Erro ao salvar: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteAgendamento(deleting.id);
      await logAudit('excluir', 'agendamento', deleting.id, { data: deleting.data });
      toast.success('Agendamento excluído com sucesso.');
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
  }

  async function handleCheckin(ag: Agendamento) {
    try {
      await checkinAgendamento(ag.id);
      toast.success('Check-in registrado!');
      await loadData();
    } catch (e: any) { toast.error('Erro no check-in: ' + e.message); }
  }

  async function handleCheckout(ag: Agendamento) {
    try {
      await checkoutAgendamento(ag.id);
      toast.success('Check-out registrado!');
      await loadData();
    } catch (e: any) { toast.error('Erro no check-out: ' + e.message); }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader
        titulo="Agendamentos"
        subtitulo={isCliente ? "Visualize seus agendamentos" : "Gerencie reservas e horários das salas"}
      />

      <FilterBar placeholder="Buscar por cliente, sala ou data..." value={busca} onChange={setBusca}>
        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => (
            <Button key={f.value} variant={filtroStatus === f.value ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setFiltroStatus(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
        <Select value={filtroSala} onValueChange={setFiltroSala}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Todas as salas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as salas</SelectItem>
            {salas.filter(s => s.ativo).map(s => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor_identificacao }} />
                  {s.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Presença</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState icon={CalendarDays} titulo="Nenhum agendamento encontrado" descricao={busca ? 'Tente alterar os termos de busca.' : isCliente ? 'Você ainda não possui agendamentos.' : 'Clique em "Novo Agendamento" para começar.'} />
                </TableCell>
              </TableRow>
            )}
            {paginated.map(ag => {
              const cliente = clientes.find(c => c.id === ag.cliente_id);
              const sala = salas.find(s => s.id === ag.sala_id);
              const contrato = contratos.find(c => c.id === ag.contrato_id);
              const isPast = ag.data < today;
              return (
                <TableRow key={ag.id} className={isPast ? 'opacity-60' : ''}>
                  <TableCell className="font-medium whitespace-nowrap">{new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                      {sala?.nome}
                    </div>
                  </TableCell>
                  <TableCell>{cliente?.nome_razao_social}</TableCell>
                  <TableCell className="font-mono text-xs">{contrato?.codigo || '—'}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{ag.hora_inicio} – {ag.hora_fim}</TableCell>
                  <TableCell><StatusBadge status={ag.status} /></TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col gap-0.5">
                      {ag.checkin_at ? <span className="text-success font-medium">In: {new Date(ag.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-muted-foreground">—</span>}
                      {ag.checkout_at && <span className="text-primary font-medium">Out: {new Date(ag.checkout_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">{ag.observacao || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isCliente && <DropdownMenuItem onClick={() => { setEditing(ag); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>}
                        {!ag.checkin_at && ag.status !== 'cancelado' && (
                          <DropdownMenuItem onClick={() => handleCheckin(ag)}><LogIn className="mr-2 h-4 w-4" /> Check-in</DropdownMenuItem>
                        )}
                        {ag.checkin_at && !ag.checkout_at && (
                          <DropdownMenuItem onClick={() => handleCheckout(ag)}><LogOut className="mr-2 h-4 w-4" /> Check-out</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                          const cl = clientes.find(c => c.id === ag.cliente_id);
                          const sl = salas.find(s => s.id === ag.sala_id);
                          const ct = contratos.find(c => c.id === ag.contrato_id);
                          const pl = ct ? planos.find(p => p.id === ct.plano_id) : null;
                          if (cl && sl) generateAgendamentoPdf(ag, cl, sl, ct, pl);
                        }}><FileText className="mr-2 h-4 w-4" /> Gerar PDF</DropdownMenuItem>
                        {!isCliente && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(ag); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
            })}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <TablePagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        )}
      </Card>

      <AgendamentoFormDialog open={formOpen} onOpenChange={setFormOpen} agendamento={editing} onSave={handleSave} clientes={clientesForForm} salas={salas} contratos={contratosForForm} agendamentos={agendamentos} planos={planos} disponibilidades={disponibilidades} />
      {!isCliente && <AgendamentoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />}
    </div>
  );
}
