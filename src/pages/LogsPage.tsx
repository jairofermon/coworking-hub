import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { TablePagination } from '@/components/TablePagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ClipboardList, X } from 'lucide-react';
import { toast } from 'sonner';
import { Agendamento, Cliente, Sala } from '@/types';
import { fetchAgendamentos, fetchClientes, fetchSalas } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LogsPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;
  const clienteId = user?.clienteId;

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroSala, setFiltroSala] = useState('all');
  const [filtroData, setFiltroData] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    async function load() {
      try {
        const [ag, cl, sl] = await Promise.all([fetchAgendamentos(), fetchClientes(), fetchSalas()]);
        setAgendamentos(ag); setClientes(cl); setSalas(sl);
      } catch (e: any) { toast.error('Erro ao carregar logs: ' + e.message); }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return agendamentos
      .filter(a => {
        if (isCliente && clienteId && a.cliente_id !== clienteId) return false;
        if (filtroSala !== 'all' && a.sala_id !== filtroSala) return false;
        if (filtroData && a.data !== filtroData) return false;
        if (!busca) return true;
        const cliente = clientes.find(c => c.id === a.cliente_id);
        return cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase());
      })
      .sort((a, b) => b.data.localeCompare(a.data) || b.hora_inicio.localeCompare(a.hora_inicio));
  }, [agendamentos, busca, filtroSala, filtroData, clientes, isCliente, clienteId]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [busca, filtroSala, filtroData]);

  const hasFilters = filtroSala !== 'all' || filtroData;

  if (loading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader titulo="Logs de Uso" subtitulo={isCliente ? "Seus registros de uso" : "Registro de reservas, check-in e check-out"} />

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <FilterBar placeholder="Buscar por cliente..." value={busca} onChange={setBusca} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sala</Label>
          <Select value={filtroSala} onValueChange={setFiltroSala}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {salas.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor_identificacao }} />
                    {s.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data</Label>
          <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="w-[160px] h-9" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setFiltroSala('all'); setFiltroData(''); }}>
            <X className="h-3 w-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sala</TableHead>
              {!isCliente && <TableHead>Cliente</TableHead>}
              <TableHead>Horário Reserva</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Permanência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={isCliente ? 7 : 8}>
                  <EmptyState icon={ClipboardList} titulo="Nenhum registro encontrado" descricao="Ajuste os filtros ou aguarde novos agendamentos." />
                </TableCell>
              </TableRow>
            )}
            {paginated.map(ag => {
              const cliente = clientes.find(c => c.id === ag.cliente_id);
              const sala = salas.find(s => s.id === ag.sala_id);

              let permanencia = '—';
              if (ag.checkin_at && ag.checkout_at) {
                const diffMs = new Date(ag.checkout_at).getTime() - new Date(ag.checkin_at).getTime();
                const diffMin = Math.round(diffMs / 60000);
                const h = Math.floor(diffMin / 60);
                const m = diffMin % 60;
                permanencia = h > 0 ? `${h}h ${m}min` : `${m}min`;
              }

              return (
                <TableRow key={ag.id}>
                  <TableCell className="font-medium whitespace-nowrap">{new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                      {sala?.nome}
                    </div>
                  </TableCell>
                  {!isCliente && <TableCell>{cliente?.nome_razao_social ?? '—'}</TableCell>}
                  <TableCell className="text-muted-foreground font-mono text-xs">{ag.hora_inicio} – {ag.hora_fim}</TableCell>
                  <TableCell><StatusBadge status={ag.status} /></TableCell>
                  <TableCell className="text-sm">
                    {ag.checkin_at ? (
                      <span className="text-success font-medium">{new Date(ag.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ag.checkout_at ? (
                      <span className="text-primary font-medium">{new Date(ag.checkout_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{permanencia}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <TablePagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        )}
      </Card>
    </div>
  );
}
