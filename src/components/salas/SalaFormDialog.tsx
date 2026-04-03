import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sala } from '@/types';
import { toast } from 'sonner';

interface SalaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sala?: Sala | null;
  onSave: (sala: Sala) => void;
}

const CORES_PREDEFINIDAS = [
  '#6366f1', '#ec4899', '#8b5cf6', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  '#f97316', '#a855f7', '#06b6d4', '#84cc16',
];

export function SalaFormDialog({ open, onOpenChange, sala, onSave }: SalaFormDialogProps) {
  const isEdit = !!sala;
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    ativo: true,
    cor_identificacao: CORES_PREDEFINIDAS[0],
    observacao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sala) {
      setForm({
        nome: sala.nome,
        descricao: sala.descricao,
        ativo: sala.ativo,
        cor_identificacao: sala.cor_identificacao,
        observacao: sala.observacao,
      });
    } else {
      setForm({ nome: '', descricao: '', ativo: true, cor_identificacao: CORES_PREDEFINIDAS[0], observacao: '' });
    }
    setErrors({});
  }, [sala, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const saved: Sala = {
      id: sala?.id || crypto.randomUUID(),
      ...form,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      observacao: form.observacao.trim(),
    };
    onSave(saved);
    toast.success(isEdit ? 'Sala atualizada com sucesso!' : 'Sala criada com sucesso!');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              placeholder="Ex: Sala Orquídea"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Sala individual para atendimento"
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor de identificação</Label>
            <div className="flex flex-wrap gap-2">
              {CORES_PREDEFINIDAS.map(cor => (
                <button
                  key={cor}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${form.cor_identificacao === cor ? 'border-foreground scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: cor }}
                  onClick={() => setForm(f => ({ ...f, cor_identificacao: cor }))}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              placeholder="Observações adicionais..."
              value={form.observacao}
              onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="ativo" className="font-medium">Sala ativa</Label>
              <p className="text-sm text-muted-foreground">Salas inativas não aparecem para novos contratos e agendamentos</p>
            </div>
            <Switch
              id="ativo"
              checked={form.ativo}
              onCheckedChange={checked => setForm(f => ({ ...f, ativo: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar alterações' : 'Criar sala'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
