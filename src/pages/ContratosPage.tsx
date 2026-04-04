import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockContratos as initialContratos, mockClientes as initialClientes, mockSalas as initialSalas, mockPlanos as initialPlanos, mockFormasPagamento as initialFormas } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Contrato } from '@/types';
import { ContratoFormDialog } from '@/components/contratos/ContratoFormDialog';
import { ContratoDeleteDialog } from '@/components/contratos/ContratoDeleteDialog';

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>(initialContratos);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contrato | null>(null);

  const filtered = contratos.filter(ct => {
    const cliente = initialClientes.find(c => c.id === ct.cliente_id);
    return cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) || ct.status.includes(busca.toLowerCase());
  });

  function handleSave(contrato: Contrato) {
    setContratos(prev => {
      const idx = prev.findIndex(c => c.id === contrato.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = contrato; return u; }
      return [...prev, contrato];
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setContratos(prev => prev.filter(c => c.id !== deleting.id));
    toast.success('Contrato excluído');
    setDeleteOpen(false);
    setDeleting(null);
  }

  return (
    <div className="page-container">
      <PageHeader titulo="Contratos" subtitulo="Controle de contratos de locação" acaoPrincipal={{ label: 'Novo Contrato', icon: Plus, onClick: () => { setEditing(null); setFormOpen(true); } }} />
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
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Nenhum contrato encontrado.</TableCell></TableRow>}
            {filtered.map((ct) => {
              const cliente = initialClientes.find(c => c.id === ct.cliente_id);
              const sala = initialSalas.find(s => s.id === ct.sala_id);
              const plano = initialPlanos.find(p => p.id === ct.plano_id);
              return (
                <TableRow key={ct.id}>
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
                  <TableCell className="text-muted-foreground text-sm">{new Date(ct.data_inicio).toLocaleDateString('pt-BR')} — {new Date(ct.data_fim).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><StatusBadge status={ct.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(ct); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleting(ct); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <ContratoFormDialog open={formOpen} onOpenChange={setFormOpen} contrato={editing} onSave={handleSave} clientes={initialClientes} salas={initialSalas} planos={initialPlanos} formasPagamento={initialFormas} />
      <ContratoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
}
