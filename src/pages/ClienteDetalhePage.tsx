import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Clock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Cliente, Contrato, Agendamento, Plano, Sala, Fatura } from '@/types';
import { fetchClientes, fetchContratos, fetchAgendamentos, fetchPlanos, fetchSalas, fetchFaturas } from '@/lib/api';

function calcHours(hi: string, hf: string): number {
  if (!hi || !hf) return 0;
  const [h1, m1] = hi.split(':').map(Number);
  const [h2, m2] = hf.split(':').map(Number);
  return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
}

const FUNIL_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  lead: { label: 'Lead', variant: 'outline' },
  free: { label: 'Free', variant: 'secondary' },
  pago: { label: 'Pago', variant: 'default' },
};

export default function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [cls, cts, ags, pls, sls, fts] = await Promise.all([
          fetchClientes(), fetchContratos(), fetchAgendamentos(), fetchPlanos(), fetchSalas(), fetchFaturas(id),
        ]);
        setCliente(cls.find(c => c.id === id) ?? null);
        setContratos(cts.filter(c => c.cliente_id === id));
        setAgendamentos(ags.filter(a => a.cliente_id === id));
        setPlanos(pls);
        setSalas(sls);
        setFaturas(fts);
      } catch (e: any) { toast.error('Erro: ' + e.message); }
      setLoading(false);
    }
    load();
  }, [id]);

  const contratosConsumo = useMemo(() => {
    return contratos.map(ct => {
      const plano = planos.find(p => p.id === ct.plano_id);
      const horasPrevistas = plano?.horas_previstas ?? 0;
      const agsContrato = agendamentos.filter(a => a.contrato_id === ct.id && a.status !== 'cancelado');
      const horasUsadas = agsContrato.reduce((s, a) => s + calcHours(a.hora_inicio, a.hora_fim), 0);
      const percent = horasPrevistas > 0 ? Math.min(100, (horasUsadas / horasPrevistas) * 100) : 0;
      return { ...ct, plano, horasPrevistas, horasUsadas, percent, qtdAgendamentos: agsContrato.length };
    });
  }, [contratos, agendamentos, planos]);

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!cliente) return <div className="page-container"><p>Cliente não encontrado.</p></div>;

  const funil = FUNIL_LABELS[cliente.status_funil] || FUNIL_LABELS.lead;
  const waDigits = cliente.telefone?.replace(/\D/g, '');
  const waLink = waDigits && waDigits.length >= 10 ? `https://wa.me/${waDigits.startsWith('55') ? waDigits : '55' + waDigits}` : null;

  const totalFaturas = faturas.reduce((s, f) => s + f.valor, 0);
  const totalPago = faturas.filter(f => f.status === 'pago').reduce((s, f) => s + f.valor, 0);
  const totalPendente = faturas.filter(f => f.status === 'pendente' || f.status === 'atrasado').reduce((s, f) => s + f.valor, 0);

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold">{cliente.nome_razao_social}</h1>
        <Badge variant={funil.variant}>{funil.label}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
          <p className="font-medium">{cliente.cpf_cnpj}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Contato</p>
          <p className="font-medium flex items-center gap-2">
            {cliente.telefone}
            {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-green-600" /></a>}
          </p>
          <p className="text-sm text-muted-foreground">{cliente.email}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Financeiro</p>
          <div className="flex gap-4 text-sm">
            <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">R$ {totalFaturas.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Pago:</span> <span className="font-medium text-green-600">R$ {totalPago.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Pendente:</span> <span className="font-medium text-destructive">R$ {totalPendente.toFixed(2)}</span></div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="consumo">
        <TabsList>
          <TabsTrigger value="consumo">Consumo de Horas</TabsTrigger>
          <TabsTrigger value="reservas">Histórico de Reservas ({agendamentos.length})</TabsTrigger>
          <TabsTrigger value="faturas">Faturas ({faturas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="consumo" className="space-y-4 mt-4">
          {contratosConsumo.length === 0 && <p className="text-muted-foreground text-sm">Nenhum contrato encontrado.</p>}
          {contratosConsumo.map(ct => {
            const sala = salas.find(s => s.id === ct.sala_id);
            return (
              <Card key={ct.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ct.codigo} — {ct.plano?.nome ?? 'Sem plano'}</p>
                    <p className="text-sm text-muted-foreground">{sala?.nome} · {new Date(ct.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(ct.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <StatusBadge status={ct.status} />
                </div>
                {ct.horasPrevistas > 0 && (
                  <div className="space-y-1">
                    <Progress value={ct.percent} className={`h-2 ${ct.percent >= 100 ? '[&>div]:bg-destructive' : ct.percent >= 80 ? '[&>div]:bg-yellow-500' : ''}`} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{ct.horasUsadas.toFixed(1)}h usadas de {ct.horasPrevistas.toFixed(1)}h</span>
                      <span>{ct.qtdAgendamentos} agendamento(s)</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="reservas" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhuma reserva.</TableCell></TableRow>}
                {agendamentos.map(ag => {
                  const sala = salas.find(s => s.id === ag.sala_id);
                  const contrato = contratos.find(c => c.id === ag.contrato_id);
                  return (
                    <TableRow key={ag.id}>
                      <TableCell>{new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                          {sala?.nome}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ag.hora_inicio} - {ag.hora_fim}</TableCell>
                      <TableCell className="font-mono text-xs">{contrato?.codigo || '—'}</TableCell>
                      <TableCell><StatusBadge status={ag.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="faturas" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhuma fatura.</TableCell></TableRow>}
                {faturas.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{new Date(f.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">R$ {f.valor.toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={f.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{f.data_pagamento ? new Date(f.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell>{f.forma_pagamento || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{f.observacao || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
