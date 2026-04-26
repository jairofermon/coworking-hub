import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plano, Sala } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: Plano | null;
  salas: Sala[];
  salaIdsIniciais: string[];
  onSave: (plano: Plano, salaIds: string[]) => void;
}

export function PlanoFormDialog({ open, onOpenChange, plano, salas, salaIdsIniciais, onSave }: Props) {
  const isEdit = !!plano;
  const [form, setForm] = useState({ nome: '', descricao: '', valor_previsto: '', horas_previstas: '', ativo: true });
  const [salaIds, setSalaIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plano) setForm({ nome: plano.nome, descricao: plano.descricao, valor_previsto: plano.valor_previsto ? String(plano.valor_previsto) : '', horas_previstas: plano.horas_previstas ? String(plano.horas_previstas) : '', ativo: plano.ativo });
    else setForm({ nome: '', descricao: '', valor_previsto: '', horas_previstas: '', ativo: true });
    setSalaIds(salaIdsIniciais);
    setErrors({});
  }, [plano, open, salaIdsIniciais]);

  function toggleSala(id: string, checked: boolean) {
    setSalaIds(prev => checked ? [...prev, id] : prev.filter(s => s !== id));
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome é obrigatório';
    if (!form.valor_previsto || Number(form.valor_previsto) <= 0) nextErrors.valor_previsto = 'Valor previsto é obrigatório';
    if (!form.horas_previstas || Number(form.horas_previstas) <= 0) nextErrors.horas_previstas = 'Horas previstas é obrigatório';
    if (salaIds.length === 0) nextErrors.salas = 'Selecione ao menos uma sala';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({ ...(plano?.id ? { id: plano.id } : {}), ...form, valor_previsto: Number(form.valor_previsto) || 0, horas_previstas: Number(form.horas_previstas) || 0 } as any, salaIds);
    toast.success(isEdit ? 'Plano atualizado!' : 'Plano criado!');
    onOpenChange(false);
  }

  const salasAtivas = salas.filter(s => s.ativo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={errors.nome ? 'border-destructive' : ''} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Valor Previsto (R$) *</Label>
            <Input type="number" step="0.01" min="0.01" required placeholder="0,00" value={form.valor_previsto} onChange={e => { setForm(f => ({ ...f, valor_previsto: e.target.value })); setErrors(prev => ({ ...prev, valor_previsto: '' })); }} className={errors.valor_previsto ? 'border-destructive' : ''} />
            {errors.valor_previsto && <p className="text-sm text-destructive">{errors.valor_previsto}</p>}
          </div>
          <div className="space-y-2">
            <Label>Horas Previstas *</Label>
            <Input type="number" step="0.5" min="0.5" required placeholder="0" value={form.horas_previstas} onChange={e => { setForm(f => ({ ...f, horas_previstas: e.target.value })); setErrors(prev => ({ ...prev, horas_previstas: '' })); }} className={errors.horas_previstas ? 'border-destructive' : ''} />
            {errors.horas_previstas && <p className="text-sm text-destructive">{errors.horas_previstas}</p>}
            <p className="text-xs text-muted-foreground">Quantidade de horas que o plano permite agendar no período do contrato</p>
          </div>
          <div className="space-y-2">
            <Label>Salas disponíveis no plano *</Label>
            <div className={`rounded-lg border p-3 space-y-2 max-h-48 overflow-y-auto ${errors.salas ? 'border-destructive' : ''}`}>
              {salasAtivas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sala ativa cadastrada.</p>}
              {salasAtivas.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox id={`sala-${s.id}`} checked={salaIds.includes(s.id)} onCheckedChange={(c) => toggleSala(s.id, !!c)} />
                  <label htmlFor={`sala-${s.id}`} className="text-sm cursor-pointer flex-1">{s.nome}</label>
                </div>
              ))}
            </div>
            {errors.salas && <p className="text-sm text-destructive">{errors.salas}</p>}
            <p className="text-xs text-muted-foreground">Marque as salas que poderão ser alocadas em contratos com este plano.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Plano ativo</Label>
            <Switch checked={form.ativo} onCheckedChange={checked => setForm(f => ({ ...f, ativo: checked }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar' : 'Criar plano'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
