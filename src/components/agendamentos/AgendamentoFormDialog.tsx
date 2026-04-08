import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Agendamento, Cliente, Sala, Contrato, Plano } from '@/types';
import { toast } from 'sonner';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento?: Agendamento | null;
  onSave: (ag: Agendamento) => void;
  clientes: Cliente[];
  salas: Sala[];
  contratos: Contrato[];
  agendamentos: Agendamento[];
  planos: Plano[];
}

function calcHours(horaInicio: string, horaFim: string): number {
  if (!horaInicio || !horaFim) return 0;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFim.split(':').map(Number);
  return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
}

export function AgendamentoFormDialog({ open, onOpenChange, agendamento, onSave, clientes, salas, contratos, agendamentos, planos }: Props) {
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

  const contratosClienteSala = contratos.filter(
    c => c.cliente_id === form.cliente_id && c.sala_id === form.sala_id && c.status === 'ativo'
  );

  // Hour usage calculation
  const selectedContrato = contratos.find(c => c.id === form.contrato_id);
  const selectedPlano = selectedContrato ? planos.find(p => p.id === selectedContrato.plano_id) : null;
  const horasPrevistas = selectedPlano?.horas_previstas ?? 0;

  const horasUsadas = useMemo(() => {
    if (!form.contrato_id) return 0;
    return agendamentos
      .filter(ag => {
        if (isEdit && ag.id === agendamento?.id) return false;
        return ag.contrato_id === form.contrato_id && ag.status !== 'cancelado';
      })
      .reduce((sum, ag) => sum + calcHours(ag.hora_inicio, ag.hora_fim), 0);
  }, [form.contrato_id, agendamentos, agendamento, isEdit]);

  const horasAgendamentoAtual = calcHours(form.hora_inicio, form.hora_fim);
  const horasTotalAposAgendamento = horasUsadas + horasAgendamentoAtual;
  const horasDisponivel = Math.max(0, horasPrevistas - horasUsadas);

  function handleSave() {
    const e: Record<string, string> = {};
    if (!form.sala_id) e.sala_id = 'Selecione uma sala';
    if (!form.cliente_id) e.cliente_id = 'Selecione um cliente';
    if (!form.data) e.data = 'Informe a data';
    if (!form.hora_inicio) e.hora_inicio = 'Informe o horário de início';
    if (!form.hora_fim) e.hora_fim = 'Informe o horário de fim';
    if (form.hora_inicio && form.hora_fim && form.hora_inicio >= form.hora_fim) e.hora_fim = 'Horário fim deve ser maior que início';

    if (form.cliente_id && form.sala_id && contratosClienteSala.length === 0) {
      e.contrato_id = 'Cliente não possui contrato ativo com esta sala';
    }

    if (!form.contrato_id || form.contrato_id === 'none') {
      if (contratosClienteSala.length > 0) {
        e.contrato_id = 'Selecione um contrato';
      }
    }

    if (form.contrato_id && form.contrato_id !== 'none' && form.data) {
      const contrato = contratos.find(c => c.id === form.contrato_id);
      if (contrato && (form.data < contrato.data_inicio || form.data > contrato.data_fim)) {
        e.data = `Data fora do período do contrato (${new Date(contrato.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(contrato.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')})`;
      }
    }

    if (form.sala_id && form.data && form.hora_inicio && form.hora_fim) {
      const conflito = agendamentos.find(ag => {
        if (isEdit && ag.id === agendamento?.id) return false;
        return ag.sala_id === form.sala_id && ag.data === form.data &&
          ag.hora_inicio < form.hora_fim && ag.hora_fim > form.hora_inicio;
      });
      if (conflito) {
        const clienteConflito = clientes.find(c => c.id === conflito.cliente_id);
        e.hora_inicio = `Conflito: ${conflito.hora_inicio}-${conflito.hora_fim} (${clienteConflito?.nome_razao_social || 'outro agendamento'})`;
      }
    }

    // Validate hour limit
    if (horasPrevistas > 0 && form.hora_inicio && form.hora_fim && horasTotalAposAgendamento > horasPrevistas) {
      e.hora_fim = `Excede o limite de horas do plano. Disponível: ${horasDisponivel.toFixed(1)}h, este agendamento: ${horasAgendamentoAtual.toFixed(1)}h`;
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onSave({ ...(agendamento?.id ? { id: agendamento.id } : {}), ...form } as any);
    toast.success(isEdit ? 'Agendamento atualizado!' : 'Agendamento criado!');
    onOpenChange(false);
  }

  const f = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const usagePercent = horasPrevistas > 0 ? Math.min(100, (horasUsadas / horasPrevistas) * 100) : 0;

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
              <Select value={form.sala_id} onValueChange={v => { f('sala_id', v); f('contrato_id', ''); }}>
                <SelectTrigger className={errors.sala_id ? 'border-destructive' : ''}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{salas.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
              {errors.sala_id && <p className="text-sm text-destructive">{errors.sala_id}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contrato *</Label>
            <Select value={form.contrato_id} onValueChange={v => f('contrato_id', v)} disabled={contratosClienteSala.length === 0}>
              <SelectTrigger className={errors.contrato_id ? 'border-destructive' : ''}><SelectValue placeholder={contratosClienteSala.length === 0 ? (form.cliente_id && form.sala_id ? 'Sem contrato ativo para esta sala' : 'Selecione cliente e sala') : 'Selecione um contrato...'} /></SelectTrigger>
              <SelectContent>
                {contratosClienteSala.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} ({new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contrato_id && <p className="text-sm text-destructive">{errors.contrato_id}</p>}
          </div>

          {/* Hour usage indicator */}
          {form.contrato_id && selectedPlano && horasPrevistas > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Controle de Horas — {selectedPlano.nome}
              </div>
              <Progress value={usagePercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Usadas: {horasUsadas.toFixed(1)}h</span>
                <span>Total: {horasPrevistas.toFixed(1)}h</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {horasDisponivel <= 0 ? (
                  <><AlertTriangle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive font-medium">Sem horas disponíveis</span></>
                ) : horasAgendamentoAtual > 0 && horasTotalAposAgendamento > horasPrevistas ? (
                  <><AlertTriangle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive font-medium">Este agendamento ({horasAgendamentoAtual.toFixed(1)}h) excede o limite. Disponível: {horasDisponivel.toFixed(1)}h</span></>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 font-medium">Disponível: {horasDisponivel.toFixed(1)}h{horasAgendamentoAtual > 0 ? ` · Este agendamento: ${horasAgendamentoAtual.toFixed(1)}h` : ''}</span></>
                )}
              </div>
            </div>
          )}

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
