import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { mockClientes } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientesPage() {
  const [busca, setBusca] = useState('');
  const clientes = mockClientes.filter(c =>
    c.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf_cnpj.includes(busca) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader
        titulo="Clientes"
        subtitulo="Cadastro e gerenciamento de clientes"
        acaoPrincipal={{ label: 'Novo Cliente', icon: Plus, onClick: () => toast.info('Formulário de criação será implementado') }}
      />
      <FilterBar placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." value={busca} onChange={setBusca} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome / Razão Social</TableHead>
              <TableHead>CPF / CNPJ</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{c.nome_razao_social}</TableCell>
                <TableCell className="text-muted-foreground">{c.cpf_cnpj}</TableCell>
                <TableCell>{c.especialidade}</TableCell>
                <TableCell className="text-muted-foreground">{c.telefone}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
