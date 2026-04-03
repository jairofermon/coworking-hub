import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockContratos, mockClientes, mockSalas, mockPlanos } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ContratosPage() {
  const [busca, setBusca] = useState('');
  const contratos = mockContratos.filter(ct => {
    const cliente = mockClientes.find(c => c.id === ct.cliente_id);
    return cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) || ct.status.includes(busca.toLowerCase());
  });

  return (
    <div className="page-container">
      <PageHeader
        titulo="Contratos"
        subtitulo="Controle de contratos de locação"
        acaoPrincipal={{ label: 'Novo Contrato', icon: Plus, onClick: () => toast.info('Formulário de criação será implementado') }}
      />
      <FilterBar placeholder="Buscar por cliente ou status..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Valor Líquido</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((ct) => {
              const cliente = mockClientes.find(c => c.id === ct.cliente_id);
              const sala = mockSalas.find(s => s.id === ct.sala_id);
              const plano = mockPlanos.find(p => p.id === ct.plano_id);
              return (
                <TableRow key={ct.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{cliente?.nome_razao_social}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                      {sala?.nome}
                    </div>
                  </TableCell>
                  <TableCell>{plano?.nome}</TableCell>
                  <TableCell>R$ {ct.valor_total.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>R$ {ct.valor_liquido.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(ct.data_inicio).toLocaleDateString('pt-BR')} — {new Date(ct.data_fim).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell><StatusBadge status={ct.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
