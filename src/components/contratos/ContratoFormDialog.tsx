import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contrato, Cliente, Sala, Plano, FormaPagamento } from '@/types';
import { toast } from 'sonner';
import { Search, AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato?: Contrato | null;
  onSave: (contrato: Contrato) => void;
  clientes: Cliente[];
  salas: Sala[];
  planos: Plano[];
  formasPagamento: FormaPagamento[];
}

export function ContratoFormDialog({ open, onOpenChange, contrato, onSave, clientes, salas, planos, formasPagamento }: Props) {
  const isEdit = !!contrato;
  const [form, setForm] = useState({
    cliente_id: '', sala_id: '', plano_id: '', forma_pagamento_id: '',
    valor_total: 0, desconta_taxa: false, data_inicio: '', data_fim: '',
    status: 'ativo' as Contrato['status'], observacao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cpfSearch, setCpfSearch] = useState('');

  useEffect(() => {
    if (contrato) {
      setForm({
        cliente_id: contrato.cliente_id, sala_id: contrato.sala_id, plano_id: contrato.plano_id,
        forma_pagamento_id: contrato.forma_pagamento_id, valor_total: contrato.valor_total,
        desconta_taxa: contrato.desconta_taxa, data_inicio: contrato.data_inicio,
        data_fim: contrato.data_fim, status: contrato.status, observacao: contrato.observacao,
      });
      const cl = clientes.find(c => c.id === contrato.cliente_id);
      setCpfSearch(cl?.cpf_cnpj || '');
    } else {
      setForm({ cliente_id: '', sala_id: '', plano_id: '', forma_pagamento_id: '', valor_total: 0, desconta_taxa: false, data_inicio: '', data_fim: '', status: 'ativo', observacao: '' });
      setCpfSearch('');
    }
    setErrors({});
  }, [contrato, open]);

  function isClienteIncomplete(c: Cliente): string[] {
    const missing: string[] = [];
    if (!c.cpf_cnpj) missing.push('CPF/CNPJ');
    if (!c.email) missing.push('E-mail');
    if (!c.telefone) missing.push('Telefone');
    if (!c.endereco_completo) missing.push('Endereço');
    return missing;
  }

  // Filter clients by CPF search
  const filteredClientes = useMemo(() => {
    if (!cpfSearch.trim()) return clientes;
    const search = cpfSearch.replace(/\D/g, '');
    return clientes.filter(c => c.cpf_cnpj.replace(/\D/g, '').includes(search));
  }, [clientes, cpfSearch]);

  const selectedCliente = clientes.find(c => c.id === form.cliente_id);
  const selectedClienteMissing = selectedCliente ? isClienteIncomplete(selectedCliente) : [];

  const fp = formasPagamento.find(f => f.id === form.forma_pagamento_id);
  const valor_taxa = form.desconta_taxa && fp ? (form.valor_total * fp.taxa_percentual) / 100 : 0;
  const valor_liquido = form.valor_total - valor_taxa;

  function handleSave() {
    const e: Record<string, string> = {};
    if (!form.cliente_id) e.cliente_id = 'Selecione um cliente';
    if (form.cliente_id && selectedClienteMissing.length > 0) {
      e.cliente_id = `Cadastro incompleto: faltam ${selectedClienteMissing.join(', ')}`;
    }
    if (!form.sala_id) e.sala_id = 'Selecione uma sala';
    if (!form.plano_id) e.plano_id = 'Selecione um plano';
    if (!form.forma_pagamento_id) e.forma_pagamento_id = 'Selecione uma forma de pagamento';
    if (!form.data_inicio) e.data_inicio = 'Informe a data de início';
    if (!form.data_fim) e.data_fim = 'Informe a data de fim';
    if (form.valor_total <= 0) e.valor_total = 'Informe o valor total';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onSave({
      ...(contrato?.id ? { id: contrato.id } : {}),
      ...form, valor_taxa, valor_liquido,
    } as any);
    toast.success(isEdit ? 'Contrato atualizado!' : 'Contrato criado!');
    onOpenChange(false);
  }

  const f = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* CPF Search + Client selector */}
          <div className="sm:col-span-2 space-y-2">
            <Label>Buscar Cliente por CPF/CNPJ</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o CPF ou CNPJ para filtrar..."
                value={cpfSearch}
                onChange={e => setCpfSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={form.cliente_id} onValueChange={v => {
              f('cliente_id', v);
              const cl = clientes.find(c => c.id === v);
              if (cl) setCpfSearch(cl.cpf_cnpj);
            }}>
              <SelectTrigger className={errors.cliente_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {filteredClientes.length === 0 && (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">Nenhum cliente encontrado</div>
                )}
                {filteredClientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome_razao_social} — {c.cpf_cnpj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCliente && (
              <p className="text-xs text-muted-foreground">CPF/CNPJ: {selectedCliente.cpf_cnpj}</p>
            )}
            {errors.cliente_id && <p className="text-sm text-destructive">{errors.cliente_id}</p>}
          </div>
          <div className="space-y-2">
            <Label>Sala *</Label>
            <Select value={form.sala_id} onValueChange={v => f('sala_id', v)}>
              <SelectTrigger className={errors.sala_id ? 'border-destructive' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{salas.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
            </Select>
            {errors.sala_id && <p className="text-sm text-destructive">{errors.sala_id}</p>}
          </div>
          <div className="space-y-2">
            <Label>Plano *</Label>
            <Select value={form.plano_id} onValueChange={v => f('plano_id', v)}>
              <SelectTrigger className={errors.plano_id ? 'border-destructive' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{planos.filter(p => p.ativo).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
            {errors.plano_id && <p className="text-sm text-destructive">{errors.plano_id}</p>}
          </div>
          <div className="space-y-2">
            <Label>Forma de Pagamento *</Label>
            <Select value={form.forma_pagamento_id} onValueChange={v => f('forma_pagamento_id', v)}>
              <SelectTrigger className={errors.forma_pagamento_id ? 'border-destructive' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{formasPagamento.filter(fp => fp.ativo).map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>)}</SelectContent>
            </Select>
            {errors.forma_pagamento_id && <p className="text-sm text-destructive">{errors.forma_pagamento_id}</p>}
          </div>
          <div className="space-y-2">
            <Label>Valor Total (R$) *</Label>
            <Input type="number" step="0.01" value={form.valor_total} onChange={e => f('valor_total', parseFloat(e.target.value) || 0)} className={errors.valor_total ? 'border-destructive' : ''} />
            {errors.valor_total && <p className="text-sm text-destructive">{errors.valor_total}</p>}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => f('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data Início *</Label>
            <Input type="date" value={form.data_inicio} onChange={e => f('data_inicio', e.target.value)} className={errors.data_inicio ? 'border-destructive' : ''} />
            {errors.data_inicio && <p className="text-sm text-destructive">{errors.data_inicio}</p>}
          </div>
          <div className="space-y-2">
            <Label>Data Fim *</Label>
            <Input type="date" value={form.data_fim} onChange={e => f('data_fim', e.target.value)} className={errors.data_fim ? 'border-destructive' : ''} />
            {errors.data_fim && <p className="text-sm text-destructive">{errors.data_fim}</p>}
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Descontar taxa da forma de pagamento</Label>
              {fp && <p className="text-xs text-muted-foreground">Taxa: {fp.taxa_percentual}% = R$ {valor_taxa.toFixed(2)}</p>}
            </div>
            <Switch checked={form.desconta_taxa} onCheckedChange={v => f('desconta_taxa', v)} />
          </div>
          <div className="sm:col-span-2 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between"><span>Valor Total:</span><span className="font-medium">R$ {form.valor_total.toFixed(2)}</span></div>
            {form.desconta_taxa && <div className="flex justify-between text-muted-foreground"><span>Taxa:</span><span>- R$ {valor_taxa.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold border-t mt-1 pt-1"><span>Valor Líquido:</span><span>R$ {valor_liquido.toFixed(2)}</span></div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={e => f('observacao', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar' : 'Criar contrato'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
