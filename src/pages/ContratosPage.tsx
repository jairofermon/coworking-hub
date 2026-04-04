import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Contrato, Cliente, Sala, Plano, FormaPagamento } from '@/types';
import { ContratoFormDialog } from '@/components/contratos/ContratoFormDialog';
import { ContratoDeleteDialog } from '@/components/contratos/ContratoDeleteDialog';
import { fetchContratos, upsertContrato, deleteContrato, fetchClientes, fetchSalas, fetchPlanos, fetchFormasPagamento } from '@/lib/api';

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contrato | null>(null);

  async function loadData() {
    try {
      const [ct, cl, sl, pl, fp] = await Promise.all([fetchContratos(), fetchClientes(), fetchSalas(), fetchPlanos(), fetchFormasPagamento()]);
      setContratos(ct); setClientes(cl); setSalas(sl); setPlanos(pl); setFormas(fp);
    } catch (e: any) { toast.error('Erro: ' + e.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = contratos.filter(ct => {
    const cliente = clientes.find(c => c.id === ct.cliente_id);
    return cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) || ct.status.includes(busca.toLowerCase());
  });

  async function handleSave(contrato: Contrato) {
    try { await upsertContrato(contrato); await loadData(); } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteContrato(deleting.id);
      toast.success('Contrato excluído');
      setDeleteOpen(false); setDeleting(null); await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

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
              const cliente = clientes.find(c => c.id === ct.cliente_id);
              const sala = salas.find(s => s.id === ct.sala_id);
              const plano = planos.find(p => p.id === ct.plano_id);
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
      <ContratoFormDialog open={formOpen} onOpenChange={setFormOpen} contrato={editing} onSave={handleSave} clientes={clientes} salas={salas} planos={planos} formasPagamento={formas} />
      <ContratoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
}
