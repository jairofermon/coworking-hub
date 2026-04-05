import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Cliente } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSave: (cliente: Cliente) => void;
}

export function ClienteFormDialog({ open, onOpenChange, cliente, onSave }: Props) {
  const isEdit = !!cliente;
  const [form, setForm] = useState({
    cpf_cnpj: '', rg_inscricao_estadual: '', nome_razao_social: '', especialidade: '',
    data_nascimento: '', telefone: '', email: '', endereco_completo: '', chave_pix: '', observacao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cliente) {
      setForm({
        cpf_cnpj: cliente.cpf_cnpj, rg_inscricao_estadual: cliente.rg_inscricao_estadual,
        nome_razao_social: cliente.nome_razao_social, especialidade: cliente.especialidade,
        data_nascimento: cliente.data_nascimento, telefone: cliente.telefone,
        email: cliente.email, endereco_completo: cliente.endereco_completo,
        chave_pix: cliente.chave_pix, observacao: cliente.observacao,
      });
    } else {
      setForm({ cpf_cnpj: '', rg_inscricao_estadual: '', nome_razao_social: '', especialidade: '', data_nascimento: '', telefone: '', email: '', endereco_completo: '', chave_pix: '', observacao: '' });
    }
    setErrors({});
  }, [cliente, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome_razao_social.trim()) e.nome_razao_social = 'Nome é obrigatório';
    if (!form.cpf_cnpj.trim()) e.cpf_cnpj = 'CPF/CNPJ é obrigatório';
    if (!form.email.trim()) e.email = 'E-mail é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = new Date().toISOString();
    const saved: any = {
      ...(cliente?.id ? { id: cliente.id } : {}),
      ...form,
      created_at: cliente?.created_at || now,
      updated_at: now,
    };
    onSave(saved);
    toast.success(isEdit ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
    onOpenChange(false);
  }

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome / Razão Social *</Label>
            <Input value={form.nome_razao_social} onChange={e => f('nome_razao_social', e.target.value)} className={errors.nome_razao_social ? 'border-destructive' : ''} />
            {errors.nome_razao_social && <p className="text-sm text-destructive">{errors.nome_razao_social}</p>}
          </div>
          <div className="space-y-2">
            <Label>CPF / CNPJ *</Label>
            <Input value={form.cpf_cnpj} onChange={e => f('cpf_cnpj', e.target.value)} className={errors.cpf_cnpj ? 'border-destructive' : ''} />
            {errors.cpf_cnpj && <p className="text-sm text-destructive">{errors.cpf_cnpj}</p>}
          </div>
          <div className="space-y-2">
            <Label>RG / Inscrição Estadual</Label>
            <Input value={form.rg_inscricao_estadual} onChange={e => f('rg_inscricao_estadual', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Input value={form.especialidade} onChange={e => f('especialidade', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_nascimento} onChange={e => f('data_nascimento', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={e => f('telefone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Endereço Completo</Label>
            <Input value={form.endereco_completo} onChange={e => f('endereco_completo', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input value={form.chave_pix} onChange={e => f('chave_pix', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={e => f('observacao', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar alterações' : 'Criar cliente'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
