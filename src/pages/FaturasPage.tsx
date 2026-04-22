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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Receipt, ArrowUpDown, FileDown } from 'lucide-react';
import { generateFaturaPdf } from '@/lib/pdf';
import { toast } from 'sonner';
import { Fatura, Cliente, Contrato, FormaPagamento } from '@/types';
import { fetchFaturas, upsertFatura, deleteFatura, fetchClientes, fetchContratos, fetchFormasPagamento } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClienteSearchSelect } from '@/components/ClienteSearchSelect';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'pago', label: 'Pagas' },
  { value: 'atrasado', label: 'Atrasadas' },
  { value: 'cancelado', label: 'Canceladas' },
];

export default function FaturasPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;
  const clienteId = user?.clienteId;

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fatura | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Fatura | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [form, setForm] = useState({
    cliente_id: '', contrato_id: '', valor: '', data_vencimento: '',
    data_pagamento: '', status: 'pendente', forma_pagamento: '', observacao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      const [ft, cl, ct, fp] = await Promise.all([fetchFaturas(), fetchClientes(), fetchContratos(), fetchFormasPagamento()]);
      setFaturas(ft); setClientes(cl); setContratos(ct); setFormas(fp);
    } catch (e: any) { toast.error('Erro ao carregar faturas: ' + e.message); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openForm(fatura?: Fatura) {
    if (fatura) {
      setEditing(fatura);
      setForm({
        cliente_id: fatura.cliente_id, contrato_id: fatura.contrato_id,
        valor: fatura.valor.toString(), data_vencimento: fatura.data_vencimento,
        data_pagamento: fatura.data_pagamento, status: fatura.status,
        forma_pagamento: fatura.forma_pagamento, observacao: fatura.observacao,
      });
    } else {
      setEditing(null);
      setForm({ cliente_id: '', contrato_id: '', valor: '', data_vencimento: '', data_pagamento: '', status: 'pendente', forma_pagamento: '', observacao: '' });
    }
    setErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const e: Record<string, string> = {};
    if (!form.cliente_id) e.cliente_id = 'Selecione um cliente';
    if (!form.valor || Number(form.valor) <= 0) e.valor = 'Informe um valor válido';
    if (!form.data_vencimento) e.data_vencimento = 'Informe a data de vencimento';
    if (contratoSelecionado && totalComFaturaAtual > contratoSelecionado.valor_total) {
      const excedente = totalComFaturaAtual - contratoSelecionado.valor_total;
      e.valor = `O contrato permite até R$ ${contratoSelecionado.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Excedente: R$ ${excedente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      const payload: any = {
        ...form, valor: Number(form.valor),
        contrato_id: form.contrato_id === 'none' ? '' : form.contrato_id,
        ...(editing?.id ? { id: editing.id } : {}),
      };
      const isNew = !editing?.id;
      const saved = await upsertFatura(payload);
      await logAudit(isNew ? 'criar' : 'editar', 'fatura', saved.id, { valor: saved.valor });
      toast.success(isNew ? 'Fatura criada com sucesso!' : 'Fatura atualizada.');
      if (contratoSelecionado && valorPendenteContrato > 0) {
        toast.warning(`Contrato de R$ ${contratoSelecionado.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Ainda falta faturar R$ ${valorPendenteContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
      }
      setFormOpen(false);
      await loadData();
    } catch (err: any) { toast.error('Erro ao salvar: ' + err.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteFatura(deleting.id);
      await logAudit('excluir', 'fatura', deleting.id, {});
      toast.success('Fatura excluída com sucesso.');
      setDeleteOpen(false); setDeleting(null);
      await loadData();
    } catch (err: any) { toast.error('Erro ao excluir: ' + err.message); }
  }

  const filtered = useMemo(() => {
    return faturas.filter(f => {
      if (isCliente && clienteId && f.cliente_id !== clienteId) return false;
      if (filtroStatus !== 'all' && f.status !== filtroStatus) return false;
      if (!busca) return true;
      const q = busca.toLowerCase();
      const cliente = clientes.find(c => c.id === f.cliente_id);
      return (cliente?.nome_razao_social.toLowerCase().includes(q)) || (cliente?.cpf_cnpj?.toLowerCase().includes(q)) || f.data_vencimento.includes(busca);
    });
  }, [faturas, busca, filtroStatus, clientes, isCliente, clienteId]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [busca, filtroStatus]);

  const contratosCliente = contratos.filter(c => c.cliente_id === form.cliente_id);
  const contratoSelecionado = contratos.find(c => c.id === form.contrato_id);
  const totalFaturadoNoContrato = contratoSelecionado
    ? faturas
        .filter(f => f.contrato_id === contratoSelecionado.id && f.status !== 'cancelado' && f.id !== editing?.id)
        .reduce((sum, f) => sum + f.valor, 0)
    : 0;
  const valorAtualFatura = Number(form.valor) || 0;
  const totalComFaturaAtual = totalFaturadoNoContrato + valorAtualFatura;
  const valorPendenteContrato = contratoSelecionado ? Math.max(contratoSelecionado.valor_total - totalComFaturaAtual, 0) : 0;

  if (loading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader
        titulo="Faturas"
        subtitulo={isCliente ? "Visualize suas faturas" : "Controle de faturamento e pagamentos"}
        acaoPrincipal={!isCliente ? { label: 'Nova Fatura', icon: Plus, onClick: () => openForm() } : undefined}
      />

      <FilterBar placeholder="Buscar por cliente ou data..." value={busca} onChange={setBusca}>
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
              {!isCliente && <TableHead>Cliente</TableHead>}
              <TableHead>Contrato</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Status</TableHead>
              {!isCliente && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={isCliente ? 6 : 8}>
                  <EmptyState icon={Receipt} titulo="Nenhuma fatura encontrada" descricao={busca ? 'Tente alterar os termos de busca.' : isCliente ? 'Você ainda não possui faturas.' : 'Clique em "Nova Fatura" para criar.'} />
                </TableCell>
              </TableRow>
            )}
            {paginated.map(f => {
              const cliente = clientes.find(c => c.id === f.cliente_id);
              const contrato = contratos.find(c => c.id === f.contrato_id);
              return (
                <TableRow key={f.id}>
                  {!isCliente && <TableCell className="font-medium">{cliente?.nome_razao_social ?? '—'}</TableCell>}
                  <TableCell className="font-mono text-xs">{contrato?.codigo || '—'}</TableCell>
                  <TableCell className="font-medium">R$ {f.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(f.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{f.data_pagamento ? new Date(f.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{f.forma_pagamento || '—'}</TableCell>
                  <TableCell><StatusBadge status={f.status} /></TableCell>
                  {!isCliente && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            const cli = clientes.find(c => c.id === f.cliente_id);
                            const ct = contratos.find(c => c.id === f.contrato_id) || null;
                            if (!cli) { toast.error('Cliente não encontrado'); return; }
                            generateFaturaPdf(f, cli, ct);
                          }}><FileDown className="mr-2 h-4 w-4" /> Gerar PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openForm(f)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(f); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
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
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Fatura' : 'Nova Fatura'}</DialogTitle>
                <DialogDescription>Preencha os dados da fatura abaixo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Cliente <span className="text-destructive">*</span></Label>
                  <ClienteSearchSelect
                    clientes={clientes}
                    value={form.cliente_id}
                    onChange={v => setForm(p => ({ ...p, cliente_id: v, contrato_id: '' }))}
                    error={errors.cliente_id}
                  />
                  {errors.cliente_id && <p className="text-xs text-destructive">{errors.cliente_id}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contrato (opcional)</Label>
                  <Select value={form.contrato_id || 'none'} onValueChange={v => setForm(p => ({ ...p, contrato_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Nenhum contrato" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {contratosCliente.map(c => <SelectItem key={c.id} value={c.id}>{c.codigo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {contratoSelecionado && (
                    <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between gap-3"><span>Valor do contrato</span><span className="font-medium text-foreground">R$ {contratoSelecionado.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Já faturado</span><span>R$ {totalFaturadoNoContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Após esta fatura</span><span>R$ {totalComFaturaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex items-center justify-between gap-3 border-t pt-1"><span>Falta faturar</span><span className="font-medium text-foreground">R$ {valorPendenteContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor <span className="text-destructive">*</span></Label>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} className={errors.valor ? 'border-destructive' : ''} />
                    {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vencimento <span className="text-destructive">*</span></Label>
                    <Input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} className={errors.data_vencimento ? 'border-destructive' : ''} />
                    {errors.data_vencimento && <p className="text-xs text-destructive">{errors.data_vencimento}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Data do pagamento</Label>
                    <Input type="date" value={form.data_pagamento} onChange={e => setForm(p => ({ ...p, data_pagamento: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={form.forma_pagamento} onValueChange={v => setForm(p => ({ ...p, forma_pagamento: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {formas.filter(f => f.ativo).map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} rows={2} placeholder="Observações opcionais..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{editing ? 'Salvar alterações' : 'Criar fatura'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir fatura?</DialogTitle>
                <DialogDescription>Essa ação não poderá ser desfeita. A fatura será removida permanentemente.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Confirmar exclusão</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
