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
  const [form, setForm] = useState({ nome: '', descricao: '', valor_previsto: 0, horas_previstas: 0, ativo: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plano) setForm({ nome: plano.nome, descricao: plano.descricao, valor_previsto: plano.valor_previsto, horas_previstas: plano.horas_previstas, ativo: plano.ativo });
    else setForm({ nome: '', descricao: '', valor_previsto: 0, horas_previstas: 0, ativo: true });
    setErrors({});
  }, [plano, open]);

  function handleSave() {
    if (!form.nome.trim()) { setErrors({ nome: 'Nome é obrigatório' }); return; }
    onSave({ ...(plano?.id ? { id: plano.id } : {}), ...form } as any);
    toast.success(isEdit ? 'Plano atualizado!' : 'Plano criado!');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            <Label>Valor Previsto (R$)</Label>
            <Input type="number" step="0.01" value={form.valor_previsto} onChange={e => setForm(f => ({ ...f, valor_previsto: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-2">
            <Label>Horas Previstas</Label>
            <Input type="number" step="0.5" min="0" value={form.horas_previstas} onChange={e => setForm(f => ({ ...f, horas_previstas: parseFloat(e.target.value) || 0 }))} />
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
