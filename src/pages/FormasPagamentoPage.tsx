import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockFormasPagamento } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FormasPagamentoPage() {
  const [busca, setBusca] = useState('');
  const formas = mockFormasPagamento.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader
        titulo="Formas de Pagamento"
        subtitulo="Configure as formas de pagamento aceitas"
        acaoPrincipal={{ label: 'Nova Forma', icon: Plus, onClick: () => toast.info('Formulário de criação será implementado') }}
      />
      <FilterBar placeholder="Buscar forma de pagamento..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Dias p/ Recebimento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Parcelamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formas.map((f) => (
              <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.taxa_percentual}%</TableCell>
                <TableCell>{f.dias_recebimento === 0 ? 'Imediato' : `${f.dias_recebimento} dias`}</TableCell>
                <TableCell className="text-muted-foreground">{f.tipo_recebimento}</TableCell>
                <TableCell>{f.permite_parcelamento ? 'Sim' : 'Não'}</TableCell>
                <TableCell><StatusBadge status={f.ativo} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
