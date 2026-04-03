import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockAgendamentos, mockClientes, mockSalas } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AgendamentosPage() {
  const [busca, setBusca] = useState('');
  const agendamentos = mockAgendamentos.filter(ag => {
    const cliente = mockClientes.find(c => c.id === ag.cliente_id);
    const sala = mockSalas.find(s => s.id === ag.sala_id);
    return (
      cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) ||
      sala?.nome.toLowerCase().includes(busca.toLowerCase()) ||
      ag.data.includes(busca)
    );
  });

  return (
    <div className="page-container">
      <PageHeader
        titulo="Agendamentos"
        subtitulo="Gerencie reservas e horários das salas"
        acaoPrincipal={{ label: 'Novo Agendamento', icon: Plus, onClick: () => toast.info('Formulário de criação será implementado') }}
      />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {agendamentos.map((ag) => {
              const cliente = mockClientes.find(c => c.id === ag.cliente_id);
              const sala = mockSalas.find(s => s.id === ag.sala_id);
              return (
                <TableRow key={ag.id} className="cursor-pointer hover:bg-muted/50">
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
