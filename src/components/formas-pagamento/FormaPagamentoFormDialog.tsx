import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormaPagamento } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forma?: FormaPagamento | null;
  onSave: (forma: FormaPagamento) => void;
}

export function FormaPagamentoFormDialog({ open, onOpenChange, forma, onSave }: Props) {
  const isEdit = !!forma;
  const [form, setForm] = useState({
    nome: '', taxa_percentual: '', dias_recebimento: '', tipo_recebimento: '', permite_parcelamento: false, observacao: '', ativo: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (forma) setForm({ nome: forma.nome, taxa_percentual: forma.taxa_percentual ? String(forma.taxa_percentual) : '', dias_recebimento: forma.dias_recebimento ? String(forma.dias_recebimento) : '', tipo_recebimento: forma.tipo_recebimento, permite_parcelamento: forma.permite_parcelamento, observacao: forma.observacao, ativo: forma.ativo });
    else setForm({ nome: '', taxa_percentual: '', dias_recebimento: '', tipo_recebimento: '', permite_parcelamento: false, observacao: '', ativo: true });
    setErrors({});
  }, [forma, open]);

  function handleSave() {
    if (!form.nome.trim()) { setErrors({ nome: 'Nome é obrigatório' }); return; }
    onSave({ ...(forma?.id ? { id: forma.id } : {}), ...form, taxa_percentual: Number(form.taxa_percentual) || 0, dias_recebimento: Number(form.dias_recebimento) || 0 } as any);
    toast.success(isEdit ? 'Forma de pagamento atualizada!' : 'Forma de pagamento criada!');
    onOpenChange(false);
  }

  const f = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => f('nome', e.target.value)} className={errors.nome ? 'border-destructive' : ''} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa (%)</Label>
              <Input type="number" step="0.1" min="0" placeholder="0" value={form.taxa_percentual} onChange={e => f('taxa_percentual', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dias p/ Recebimento</Label>
              <Input type="number" min="0" placeholder="0" value={form.dias_recebimento} onChange={e => f('dias_recebimento', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Recebimento</Label>
            <Input value={form.tipo_recebimento} onChange={e => f('tipo_recebimento', e.target.value)} placeholder="Ex: Imediato, Parcelado, Compensação" />
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={e => f('observacao', e.target.value)} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Permite parcelamento</Label>
            <Switch checked={form.permite_parcelamento} onCheckedChange={v => f('permite_parcelamento', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Ativo</Label>
            <Switch checked={form.ativo} onCheckedChange={v => f('ativo', v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
