import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plano } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: Plano | null;
  onSave: (plano: Plano) => void;
}

export function PlanoFormDialog({ open, onOpenChange, plano, onSave }: Props) {
  const isEdit = !!plano;
  const [form, setForm] = useState({ nome: '', descricao: '', valor_previsto: '', horas_previstas: '', ativo: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plano) setForm({ nome: plano.nome, descricao: plano.descricao, valor_previsto: plano.valor_previsto ? String(plano.valor_previsto) : '', horas_previstas: plano.horas_previstas ? String(plano.horas_previstas) : '', ativo: plano.ativo });
    else setForm({ nome: '', descricao: '', valor_previsto: '', horas_previstas: '', ativo: true });
    setErrors({});
  }, [plano, open]);

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome é obrigatório';
    if (!form.valor_previsto || Number(form.valor_previsto) <= 0) nextErrors.valor_previsto = 'Valor previsto é obrigatório';
    if (!form.horas_previstas || Number(form.horas_previstas) <= 0) nextErrors.horas_previstas = 'Horas previstas é obrigatório';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({ ...(plano?.id ? { id: plano.id } : {}), ...form, valor_previsto: Number(form.valor_previsto) || 0, horas_previstas: Number(form.horas_previstas) || 0 } as any);
    toast.success(isEdit ? 'Plano atualizado!' : 'Plano criado!');
    onOpenChange(false);
  }

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
            <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor_previsto} onChange={e => setForm(f => ({ ...f, valor_previsto: e.target.value }))} className={errors.valor_previsto ? 'border-destructive' : ''} />
            {errors.valor_previsto && <p className="text-sm text-destructive">{errors.valor_previsto}</p>}
          </div>
          <div className="space-y-2">
            <Label>Horas Previstas *</Label>
            <Input type="number" step="0.5" min="0" placeholder="0" value={form.horas_previstas} onChange={e => setForm(f => ({ ...f, horas_previstas: e.target.value }))} className={errors.horas_previstas ? 'border-destructive' : ''} />
            {errors.horas_previstas && <p className="text-sm text-destructive">{errors.horas_previstas}</p>}
            <p className="text-xs text-muted-foreground">Quantidade de horas que o plano permite agendar no período do contrato</p>
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
