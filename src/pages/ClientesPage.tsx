import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { TablePagination } from '@/components/TablePagination';
import { AlertBanner } from '@/components/AlertBanner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, MoreHorizontal, Pencil, Trash2, MessageCircle, Eye, Users, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Cliente, Contrato, Agendamento } from '@/types';
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog';
import { ClienteDeleteDialog } from '@/components/clientes/ClienteDeleteDialog';
import { fetchClientes, upsertCliente, deleteCliente, fetchContratos, fetchAgendamentos } from '@/lib/api';
import { logAudit } from '@/lib/audit';

const FUNIL_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  lead: { label: 'Lead', variant: 'outline' },
  free: { label: 'Free', variant: 'secondary' },
  pago: { label: 'Pago', variant: 'default' },
};

const FUNIL_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'incompleto', label: '⚠ Incompletos' },
  { value: 'lead', label: 'Lead' },
  { value: 'free', label: 'Free' },
  { value: 'pago', label: 'Pago' },
];

function formatWhatsAppLink(telefone: string): string | null {
  if (!telefone) return null;
  const digits = telefone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const num = digits.startsWith('55') ? digits : '55' + digits;
  return `https://wa.me/${num}`;
}

function isIncompleteClient(c: Cliente): string[] {
  const missing: string[] = [];
  if (!c.cpf_cnpj) missing.push('CPF/CNPJ');
  if (!c.email) missing.push('E-mail');
  if (!c.telefone) missing.push('Telefone');
  if (!c.endereco_completo) missing.push('Endereço');
  return missing;
}

type SortField = 'nome_razao_social' | 'status_funil' | 'especialidade';

export default function ClientesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [filtroFunil, setFiltroFunil] = useState(() => searchParams.get('filtro') || 'all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('nome_razao_social');
  const [sortAsc, setSortAsc] = useState(true);

  async function loadData() {
    try {
      const [cl, ct, ag] = await Promise.all([fetchClientes(), fetchContratos(), fetchAgendamentos()]);
      setClientes(cl); setContratos(ct); setAgendamentos(ag);
    } catch (e: any) { toast.error('Erro ao carregar clientes: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let result = clientes.filter(c => {
      if (filtroFunil === 'incompleto') {
        if (isIncompleteClient(c).length === 0) return false;
      } else if (filtroFunil !== 'all' && c.status_funil !== filtroFunil) return false;
      if (!busca) return true;
      const q = busca.toLowerCase();
      return c.nome_razao_social.toLowerCase().includes(q) ||
        c.cpf_cnpj.includes(q) || c.email.toLowerCase().includes(q) ||
        (c.especialidade || '').toLowerCase().includes(q);
    });
    result.sort((a, b) => {
      const va = (a[sortField] || '').toLowerCase();
      const vb = (b[sortField] || '').toLowerCase();
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [clientes, busca, filtroFunil, sortField, sortAsc]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [busca, filtroFunil]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  function getClienteVinculos(id: string) {
    const ct = contratos.filter(c => c.cliente_id === id);
    const ag = agendamentos.filter(a => a.cliente_id === id);
    return { contratos: ct.length, agendamentos: ag.length };
  }

  async function handleSave(cliente: Cliente) {
    try {
      const isNew = !cliente.id;
      const saved = await upsertCliente(cliente);
      await logAudit(isNew ? 'criar' : 'editar', 'cliente', saved.id, { nome: saved.nome_razao_social });
      toast.success(isNew ? 'Cliente cadastrado com sucesso!' : 'Dados do cliente atualizados.');
      await loadData();
    } catch (e: any) { toast.error('Erro ao salvar: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    const vinculos = getClienteVinculos(deleting.id);
    if (vinculos.contratos > 0 || vinculos.agendamentos > 0) {
      toast.error(`Não é possível excluir "${deleting.nome_razao_social}". Existem ${vinculos.contratos} contrato(s) e ${vinculos.agendamentos} agendamento(s) vinculados.`);
      setDeleteOpen(false); setDeleting(null);
      return;
    }
    try {
      await deleteCliente(deleting.id);
      await logAudit('excluir', 'cliente', deleting.id, { nome: deleting.nome_razao_social });
      toast.success(`Cliente "${deleting.nome_razao_social}" excluído com sucesso.`);
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
  }

  if (loading) return <LoadingState />;

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="page-container">
      <PageHeader titulo="Clientes" subtitulo="Cadastro e gerenciamento de clientes" acaoPrincipal={{ label: 'Novo Cliente', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }} />

      <FilterBar placeholder="Buscar por nome, CPF/CNPJ, e-mail ou especialidade..." value={busca} onChange={setBusca}>
        <div className="flex gap-1">
          {FUNIL_FILTERS.map(f => (
            <Button
              key={f.value}
              variant={filtroFunil === f.value ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFiltroFunil(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </FilterBar>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="nome_razao_social">Nome / Razão Social</SortableHead>
              <TableHead>CPF / CNPJ</TableHead>
              <SortableHead field="especialidade">Especialidade</SortableHead>
              <SortableHead field="status_funil">Funil</SortableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-10" />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Users}
                    titulo={busca || filtroFunil !== 'all' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    descricao={busca ? 'Tente alterar os termos de busca.' : 'Clique em "Novo Cliente" para começar.'}
                  />
                </TableCell>
              </TableRow>
            )}
            {paginated.map((c) => {
              const funil = FUNIL_LABELS[c.status_funil] || FUNIL_LABELS.lead;
              const waLink = formatWhatsAppLink(c.telefone);
              const incompleto = isIncompleteClient(c);
              return (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {c.nome_razao_social}
                      {incompleto.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          </TooltipTrigger>
                          <TooltipContent>Cadastro incompleto: {incompleto.join(', ')}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{c.cpf_cnpj || '—'}</TableCell>
                  <TableCell>{c.especialidade || '—'}</TableCell>
                  <TableCell><Badge variant={funil.variant}>{funil.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {c.telefone || '—'}
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp">
                          <MessageCircle className="h-4 w-4 text-green-600 hover:text-green-700" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email || '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/clientes/${c.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/clientes/${c.id}`)}><Eye className="mr-2 h-4 w-4" /> Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(c); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <TablePagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        )}
      </Card>
      <ClienteFormDialog open={formOpen} onOpenChange={setFormOpen} cliente={editing} onSave={handleSave} />
      <ClienteDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} cliente={deleting} onConfirm={handleDelete} />
    </div>
  );
}
