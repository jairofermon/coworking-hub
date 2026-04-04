import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockAgendamentos as initialAgendamentos, mockClientes, mockSalas, mockContratos } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Agendamento } from '@/types';
import { AgendamentoFormDialog } from '@/components/agendamentos/AgendamentoFormDialog';
import { AgendamentoDeleteDialog } from '@/components/agendamentos/AgendamentoDeleteDialog';

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(initialAgendamentos);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Agendamento | null>(null);

  const filtered = agendamentos.filter(ag => {
    const cliente = mockClientes.find(c => c.id === ag.cliente_id);
    const sala = mockSalas.find(s => s.id === ag.sala_id);
    return cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) || sala?.nome.toLowerCase().includes(busca.toLowerCase()) || ag.data.includes(busca);
  });

  function handleSave(ag: Agendamento) {
    setAgendamentos(prev => {
      const idx = prev.findIndex(a => a.id === ag.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = ag; return u; }
      return [...prev, ag];
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setAgendamentos(prev => prev.filter(a => a.id !== deleting.id));
    toast.success('Agendamento excluído');
    setDeleteOpen(false);
    setDeleting(null);
  }

  return (
    <div className="page-container">
      <PageHeader titulo="Agendamentos" subtitulo="Gerencie reservas e horários das salas" acaoPrincipal={{ label: 'Novo Agendamento', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }} />
      <FilterBar placeholder="Buscar por cliente, sala ou data..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhum agendamento encontrado.</TableCell></TableRow>}
            {filtered.map((ag) => {
              const cliente = mockClientes.find(c => c.id === ag.cliente_id);
              const sala = mockSalas.find(s => s.id === ag.sala_id);
              return (
                <TableRow key={ag.id}>
                  <TableCell className="font-medium">{new Date(ag.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                      {sala?.nome}
                    </div>
                  </TableCell>
                  <TableCell>{cliente?.nome_razao_social}</TableCell>
                  <TableCell className="text-muted-foreground">{ag.hora_inicio} - {ag.hora_fim}</TableCell>
                  <TableCell><StatusBadge status={ag.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{ag.observacao || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(ag); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(ag); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <AgendamentoFormDialog open={formOpen} onOpenChange={setFormOpen} agendamento={editing} onSave={handleSave} clientes={mockClientes} salas={mockSalas} contratos={mockContratos} />
      <AgendamentoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
}
