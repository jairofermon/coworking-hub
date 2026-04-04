import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agendamento, Cliente, Sala, Contrato } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento?: Agendamento | null;
  onSave: (ag: Agendamento) => void;
  clientes: Cliente[];
  salas: Sala[];
  contratos: Contrato[];
}

export function AgendamentoFormDialog({ open, onOpenChange, agendamento, onSave, clientes, salas, contratos }: Props) {
  const isEdit = !!agendamento;
  const [form, setForm] = useState({
    sala_id: '', cliente_id: '', contrato_id: '', data: '', hora_inicio: '', hora_fim: '',
    status: 'pendente' as Agendamento['status'], observacao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agendamento) {
      setForm({
        sala_id: agendamento.sala_id, cliente_id: agendamento.cliente_id, contrato_id: agendamento.contrato_id,
        data: agendamento.data, hora_inicio: agendamento.hora_inicio, hora_fim: agendamento.hora_fim,
        status: agendamento.status, observacao: agendamento.observacao,
      });
    } else {
      setForm({ sala_id: '', cliente_id: '', contrato_id: '', data: '', hora_inicio: '', hora_fim: '', status: 'pendente', observacao: '' });
    }
    setErrors({});
  }, [agendamento, open]);

  const contratosCliente = contratos.filter(c => c.cliente_id === form.cliente_id && c.status === 'ativo');

  function handleSave() {
    const e: Record<string, string> = {};
    if (!form.sala_id) e.sala_id = 'Selecione uma sala';
    if (!form.cliente_id) e.cliente_id = 'Selecione um cliente';
    if (!form.data) e.data = 'Informe a data';
    if (!form.hora_inicio) e.hora_inicio = 'Informe o horário de início';
    if (!form.hora_fim) e.hora_fim = 'Informe o horário de fim';
    if (form.hora_inicio && form.hora_fim && form.hora_inicio >= form.hora_fim) e.hora_fim = 'Horário fim deve ser maior que início';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onSave({ id: agendamento?.id || crypto.randomUUID(), ...form });
    toast.success(isEdit ? 'Agendamento atualizado!' : 'Agendamento criado!');
    onOpenChange(false);
  }

  const f = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.cliente_id} onValueChange={v => { f('cliente_id', v); f('contrato_id', ''); }}>
                <SelectTrigger className={errors.cliente_id ? 'border-destructive' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_razao_social}</SelectItem>)}</SelectContent>
              </Select>
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
          </div>
          <div className="space-y-2">
            <Label>Contrato (opcional)</Label>
            <Select value={form.contrato_id} onValueChange={v => f('contrato_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um contrato..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem contrato</SelectItem>
                {contratosCliente.map(c => <SelectItem key={c.id} value={c.id}>Contrato {c.data_inicio} — {c.data_fim}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data *</Label>
            <Input type="date" value={form.data} onChange={e => f('data', e.target.value)} className={errors.data ? 'border-destructive' : ''} />
            {errors.data && <p className="text-sm text-destructive">{errors.data}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora Início *</Label>
              <Input type="time" value={form.hora_inicio} onChange={e => f('hora_inicio', e.target.value)} className={errors.hora_inicio ? 'border-destructive' : ''} />
              {errors.hora_inicio && <p className="text-sm text-destructive">{errors.hora_inicio}</p>}
            </div>
            <div className="space-y-2">
              <Label>Hora Fim *</Label>
              <Input type="time" value={form.hora_fim} onChange={e => f('hora_fim', e.target.value)} className={errors.hora_fim ? 'border-destructive' : ''} />
              {errors.hora_fim && <p className="text-sm text-destructive">{errors.hora_fim}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => f('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={e => f('observacao', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar' : 'Criar agendamento'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
