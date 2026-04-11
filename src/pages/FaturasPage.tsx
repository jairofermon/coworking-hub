import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Fatura, Cliente, Contrato, FormaPagamento } from '@/types';
import { fetchFaturas, upsertFatura, deleteFatura, fetchClientes, fetchContratos, fetchFormasPagamento } from '@/lib/api';
import { logAudit } from '@/lib/audit';

export default function FaturasPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fatura | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Fatura | null>(null);

  const [form, setForm] = useState({
    cliente_id: '', contrato_id: '', valor: '', data_vencimento: '',
    data_pagamento: '', status: 'pendente', forma_pagamento: '', observacao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      const [ft, cl, ct, fp] = await Promise.all([fetchFaturas(), fetchClientes(), fetchContratos(), fetchFormasPagamento()]);
      setFaturas(ft); setClientes(cl); setContratos(ct); setFormas(fp);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
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
    if (!form.valor || Number(form.valor) <= 0) e.valor = 'Informe o valor';
    if (!form.data_vencimento) e.data_vencimento = 'Informe a data';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      const payload: any = {
        ...form, valor: Number(form.valor),
        ...(editing?.id ? { id: editing.id } : {}),
      };
      const isNew = !editing?.id;
      const saved = await upsertFatura(payload);
      await logAudit(isNew ? 'criar' : 'editar', 'fatura', saved.id, { valor: saved.valor });
      toast.success(isNew ? 'Fatura criada!' : 'Fatura atualizada!');
      setFormOpen(false);
      await loadData();
    } catch (err: any) { toast.error('Erro: ' + err.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteFatura(deleting.id);
      await logAudit('excluir', 'fatura', deleting.id, {});
      toast.success('Fatura excluída');
      setDeleteOpen(false); setDeleting(null);
      await loadData();
    } catch (err: any) { toast.error('Erro: ' + err.message); }
  }

  const filtered = faturas.filter(f => {
    const cliente = clientes.find(c => c.id === f.cliente_id);
    return cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) || f.data_vencimento.includes(busca);
  });

  const contratosCliente = contratos.filter(c => c.cliente_id === form.cliente_id);

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Faturas" subtitulo="Controle de faturamento e pagamentos" acaoPrincipal={{ label: 'Nova Fatura', icon: Plus, onClick: () => openForm() }} />
      <FilterBar placeholder="Buscar por cliente ou data..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhuma fatura.</TableCell></TableRow>}
            {filtered.map(f => {
              const cliente = clientes.find(c => c.id === f.cliente_id);
              const contrato = contratos.find(c => c.id === f.contrato_id);
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{cliente?.nome_razao_social ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{contrato?.codigo || '—'}</TableCell>
                  <TableCell>R$ {f.valor.toFixed(2)}</TableCell>
                  <TableCell>{new Date(f.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-muted-foreground">{f.data_pagamento ? new Date(f.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell><StatusBadge status={f.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openForm(f)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(f); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Fatura' : 'Nova Fatura'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.cliente_id} onValueChange={v => setForm(p => ({ ...p, cliente_id: v, contrato_id: '' }))}>
                <SelectTrigger className={errors.cliente_id ? 'border-destructive' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_razao_social}</SelectItem>)}</SelectContent>
              </Select>
              {errors.cliente_id && <p className="text-sm text-destructive">{errors.cliente_id}</p>}
            </div>
            <div className="space-y-2">
              <Label>Contrato</Label>
              <Select value={form.contrato_id} onValueChange={v => setForm(p => ({ ...p, contrato_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {contratosCliente.map(c => <SelectItem key={c.id} value={c.id}>{c.codigo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} className={errors.valor ? 'border-destructive' : ''} />
                {errors.valor && <p className="text-sm text-destructive">{errors.valor}</p>}
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
                <Label>Vencimento *</Label>
                <Input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} className={errors.data_vencimento ? 'border-destructive' : ''} />
                {errors.data_vencimento && <p className="text-sm text-destructive">{errors.data_vencimento}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data Pagamento</Label>
                <Input type="date" value={form.data_pagamento} onChange={e => setForm(p => ({ ...p, data_pagamento: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={form.forma_pagamento} onValueChange={v => setForm(p => ({ ...p, forma_pagamento: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {formas.filter(f => f.ativo).map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar fatura'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir fatura?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Essa ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
