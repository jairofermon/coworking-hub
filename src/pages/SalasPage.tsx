import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockSalas } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function SalasPage() {
  const [busca, setBusca] = useState('');
  const salas = mockSalas.filter(s =>
    s.nome.toLowerCase().includes(busca.toLowerCase()) ||
    s.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader
        titulo="Salas"
        subtitulo="Gerencie as salas disponíveis para locação"
        acaoPrincipal={{ label: 'Nova Sala', icon: Plus, onClick: () => toast.info('Formulário de criação será implementado') }}
      />
      <FilterBar placeholder="Buscar sala..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salas.map((sala) => (
              <TableRow key={sala.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: sala.cor_identificacao }} />
                </TableCell>
                <TableCell className="font-medium">{sala.nome}</TableCell>
                <TableCell className="text-muted-foreground">{sala.descricao}</TableCell>
                <TableCell><StatusBadge status={sala.ativo} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{sala.observacao || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
