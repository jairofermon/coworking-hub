import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Cliente } from '@/types';
import { toast } from 'sonner';

const ESPECIALIDADES = [
  'Psicologia', 'Psiquiatria', 'Nutrição', 'Fonoaudiologia', 'Fisioterapia',
  'Terapia Ocupacional', 'Neuropsicologia', 'Pedagogia', 'Psicopedagogia',
  'Coaching', 'Mentoria', 'Advocacia', 'Contabilidade', 'Consultoria',
  'Arquitetura', 'Design', 'Marketing', 'Tecnologia', 'Medicina',
  'Odontologia', 'Enfermagem', 'Acupuntura', 'Pilates', 'Yoga',
];

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
  const [espOpen, setEspOpen] = useState(false);
  const [espSearch, setEspSearch] = useState('');

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
    setEspSearch('');
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

  const filteredEspecialidades = ESPECIALIDADES.filter(e => e.toLowerCase().includes(espSearch.toLowerCase()));

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
            <Popover open={espOpen} onOpenChange={setEspOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={espOpen} className="w-full justify-between font-normal">
                  {form.especialidade || 'Selecione ou digite...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar especialidade..." value={espSearch} onValueChange={setEspSearch} />
                  <CommandList>
                    <CommandEmpty>
                      {espSearch.trim() ? (
                        <button
                          className="w-full px-3 py-2 text-sm text-left hover:bg-accent rounded"
                          onClick={() => { f('especialidade', espSearch.trim()); setEspOpen(false); }}
                        >
                          Usar "{espSearch.trim()}"
                        </button>
                      ) : 'Nenhuma encontrada.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredEspecialidades.map(esp => (
                        <CommandItem
                          key={esp}
                          value={esp}
                          onSelect={() => { f('especialidade', esp); setEspOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.especialidade === esp ? "opacity-100" : "opacity-0")} />
                          {esp}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
