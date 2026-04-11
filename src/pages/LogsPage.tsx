import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Agendamento, Cliente, Sala } from '@/types';
import { fetchAgendamentos, fetchClientes, fetchSalas } from '@/lib/api';

export default function LogsPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroSala, setFiltroSala] = useState('all');
  const [filtroData, setFiltroData] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [ag, cl, sl] = await Promise.all([fetchAgendamentos(), fetchClientes(), fetchSalas()]);
        setAgendamentos(ag); setClientes(cl); setSalas(sl);
      } catch (e: any) { toast.error(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = agendamentos
    .filter(a => {
      if (filtroSala !== 'all' && a.sala_id !== filtroSala) return false;
      if (filtroData && a.data !== filtroData) return false;
      const cliente = clientes.find(c => c.id === a.cliente_id);
      if (busca && !cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.data.localeCompare(a.data) || b.hora_inicio.localeCompare(a.hora_inicio));

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Logs de Uso" subtitulo="Registro de reservas, check-in e check-out" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-end">
        <div className="flex-1">
          <FilterBar placeholder="Buscar por cliente..." value={busca} onChange={setBusca} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sala</Label>
          <Select value={filtroSala} onValueChange={setFiltroSala}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data</Label>
          <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="w-[160px]" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Horário Reserva</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Permanência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
            )}
            {filtered.map(ag => {
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
                  <TableCell className="font-medium">{new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                      {sala?.nome}
                    </div>
                  </TableCell>
                  <TableCell>{cliente?.nome_razao_social ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{ag.hora_inicio} - {ag.hora_fim}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      ag.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                      ag.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{ag.status}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ag.checkin_at ? (
                      <span className="text-green-600 font-medium">{new Date(ag.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
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
      </Card>
    </div>
  );
}
