import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingState } from '@/components/LoadingState';
import { AlertBanner } from '@/components/AlertBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DoorOpen, Users, FileText, CalendarDays, TrendingUp, Clock, Lightbulb, AlertTriangle, BarChart3, Receipt, X } from 'lucide-react';
import { fetchSalas, fetchClientes, fetchContratos, fetchAgendamentos, fetchDisponibilidades, fetchFaturas, inactivateExpiredContracts } from '@/lib/api';
import { Sala, Cliente, Contrato, Agendamento, DisponibilidadeSala, Fatura } from '@/types';

function calcHours(hi: string, hf: string): number {
  if (!hi || !hf) return 0;
  const [h1, m1] = hi.split(':').map(Number);
  const [h2, m2] = hf.split(':').map(Number);
  return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
}

function daysUntilExpiry(dataFim: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const fim = new Date(dataFim + 'T00:00:00');
  return Math.ceil((fim.getTime() - now.getTime()) / 86400000);
}

export default function DashboardPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeSala[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroSala, setFiltroSala] = useState<string>('all');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        await inactivateExpiredContracts().catch(() => {});
        const [s, c, ct, ag, dp, ft] = await Promise.all([fetchSalas(), fetchClientes(), fetchContratos(), fetchAgendamentos(), fetchDisponibilidades(), fetchFaturas()]);
        setSalas(s); setClientes(c); setContratos(ct); setAgendamentos(ag); setDisponibilidades(dp); setFaturas(ft);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const hasFilters = filtroSala !== 'all' || filtroDataInicio || filtroDataFim;

  const contratosFiltered = useMemo(() => {
    return contratos.filter(c => {
      if (filtroSala !== 'all' && c.sala_id !== filtroSala) return false;
      if (filtroDataInicio && c.data_fim < filtroDataInicio) return false;
      if (filtroDataFim && c.data_inicio > filtroDataFim) return false;
      return true;
    });
  }, [contratos, filtroSala, filtroDataInicio, filtroDataFim]);

  const agendamentosFiltered = useMemo(() => {
    return agendamentos.filter(a => {
      if (filtroSala !== 'all' && a.sala_id !== filtroSala) return false;
      if (filtroDataInicio && a.data < filtroDataInicio) return false;
      if (filtroDataFim && a.data > filtroDataFim) return false;
      return true;
    });
  }, [agendamentos, filtroSala, filtroDataInicio, filtroDataFim]);

  const taxaOcupacao = useMemo(() => {
    const salasAtivas = filtroSala === 'all' ? salas.filter(s => s.ativo) : salas.filter(s => s.id === filtroSala && s.ativo);
    if (salasAtivas.length === 0) return 0;
    let totalHorasDisp = 0;
    let totalHorasUsadas = 0;
    const agAtivos = agendamentosFiltered.filter(a => a.status !== 'cancelado');
    salasAtivas.forEach(sala => {
      const salaDisps = disponibilidades.filter(d => d.sala_id === sala.id && d.ativo);
      const horasSemanais = salaDisps.reduce((s, d) => s + calcHours(d.hora_inicio, d.hora_fim), 0);
      totalHorasDisp += horasSemanais * 4;
      const salaAgs = agAtivos.filter(a => a.sala_id === sala.id);
      totalHorasUsadas += salaAgs.reduce((s, a) => s + calcHours(a.hora_inicio, a.hora_fim), 0);
    });
    return totalHorasDisp > 0 ? Math.min(100, (totalHorasUsadas / totalHorasDisp) * 100) : 0;
  }, [salas, disponibilidades, agendamentosFiltered, filtroSala]);

  const salasRanking = useMemo(() => {
    const agAtivos = agendamentosFiltered.filter(a => a.status !== 'cancelado');
    const map = new Map<string, number>();
    agAtivos.forEach(a => map.set(a.sala_id, (map.get(a.sala_id) ?? 0) + calcHours(a.hora_inicio, a.hora_fim)));
    return Array.from(map.entries())
      .map(([id, hours]) => ({ sala: salas.find(s => s.id === id), hours }))
      .filter(r => r.sala)
      .sort((a, b) => b.hours - a.hours);
  }, [agendamentosFiltered, salas]);

  const horariosPico = useMemo(() => {
    const agAtivos = agendamentosFiltered.filter(a => a.status !== 'cancelado');
    const hourCounts = new Map<number, number>();
    agAtivos.forEach(a => {
      const [h] = a.hora_inicio.split(':').map(Number);
      hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
    });
    return Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: `${String(hour).padStart(2, '0')}:00`, count }));
  }, [agendamentosFiltered]);

  const horariosOciosos = useMemo(() => {
    const agAtivos = agendamentosFiltered.filter(a => a.status !== 'cancelado');
    const hourCounts = new Map<number, number>();
    for (let h = 6; h < 22; h++) hourCounts.set(h, 0);
    agAtivos.forEach(a => {
      const [h] = a.hora_inicio.split(':').map(Number);
      hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
    });
    return Array.from(hourCounts.entries())
      .filter(([_, count]) => count === 0)
      .map(([hour]) => `${String(hour).padStart(2, '0')}:00`);
  }, [agendamentosFiltered]);

  const contratosProxVenc = useMemo(() => {
    return contratos.filter(c => c.status === 'ativo' && daysUntilExpiry(c.data_fim) <= 15 && daysUntilExpiry(c.data_fim) >= 0);
  }, [contratos]);

  const faturasAtrasadas = useMemo(() => faturas.filter(f => f.status === 'atrasado'), [faturas]);

  const insights = useMemo(() => {
    const items: { type: 'warning' | 'success' | 'info'; text: string }[] = [];
    salasRanking.forEach(r => {
      if (r.hours < 5 && r.sala) items.push({ type: 'warning', text: `${r.sala.nome} está subutilizada (${r.hours.toFixed(1)}h no período).` });
    });
    horariosPico.forEach(h => {
      if (h.count >= 5) items.push({ type: 'info', text: `Horário ${h.hour} tem alta demanda (${h.count} agendamentos) — considere aumentar o preço.` });
    });
    if (horariosOciosos.length > 5) items.push({ type: 'warning', text: `${horariosOciosos.length} faixas de horário sem agendamentos no período.` });
    if (taxaOcupacao < 30) items.push({ type: 'warning', text: `Taxa de ocupação baixa (${taxaOcupacao.toFixed(0)}%). Considere promoções.` });
    else if (taxaOcupacao > 80) items.push({ type: 'success', text: `Excelente taxa de ocupação (${taxaOcupacao.toFixed(0)}%)!` });
    if (faturasAtrasadas.length > 0) items.push({ type: 'warning', text: `${faturasAtrasadas.length} fatura(s) em atraso totalizando R$ ${faturasAtrasadas.reduce((s, f) => s + f.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.` });
    return items;
  }, [salasRanking, horariosPico, horariosOciosos, taxaOcupacao, faturasAtrasadas]);

  if (loading) return <LoadingState />;

  const today = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentosFiltered.filter(a => a.data === today);
  const contratosAtivos = contratosFiltered.filter(c => c.status === 'ativo');
  const proximosAgendamentos = agendamentosFiltered.filter(a => a.data >= today && a.status !== 'cancelado').sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio)).slice(0, 5);
  const maxHours = salasRanking.length > 0 ? salasRanking[0].hours : 1;

  const stats = [
    { label: 'Taxa de Ocupação', value: `${taxaOcupacao.toFixed(0)}%`, icon: BarChart3, color: 'text-primary' },
    { label: 'Salas Ativas', value: `${salas.filter(s => s.ativo).length}`, icon: DoorOpen, color: 'text-primary' },
    { label: 'Contratos Ativos', value: String(contratosAtivos.length), icon: FileText, color: 'text-success' },
    { label: 'Agendamentos Hoje', value: String(agendamentosHoje.length), icon: CalendarDays, color: 'text-warning' },
  ];

  return (
    <div className="page-container">
      <PageHeader titulo="Dashboard Estratégico" subtitulo="Métricas e insights do CM Coworking" />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sala</Label>
          <Select value={filtroSala} onValueChange={setFiltroSala}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Todas as salas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {salas.filter(s => s.ativo).map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.cor_identificacao }} />
                    {s.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data início</Label>
          <Input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} className="w-[160px] h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data fim</Label>
          <Input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} className="w-[160px] h-9" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setFiltroSala('all'); setFiltroDataInicio(''); setFiltroDataFim(''); }}>
            <X className="h-3 w-3 mr-1" /> Limpar filtros
          </Button>
        )}
      </div>

      {/* Alertas de vencimento */}
      {contratosProxVenc.length > 0 && (
        <AlertBanner type="warning">
          <strong>{contratosProxVenc.length} contrato(s)</strong> vencem nos próximos 15 dias:{' '}
          {contratosProxVenc.map(c => `${c.codigo} (${daysUntilExpiry(c.data_fim) === 0 ? 'hoje' : daysUntilExpiry(c.data_fim) + 'd'})`).join(', ')}
        </AlertBanner>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4" />Insights Automáticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => (
              <AlertBanner key={i} type={insight.type === 'success' ? 'success' : insight.type === 'info' ? 'info' : 'warning'}>
                {insight.text}
              </AlertBanner>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><DoorOpen className="h-4 w-4" />Salas Mais Usadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {salasRanking.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados no período selecionado.</p>}
            {salasRanking.map((r) => (
              <div key={r.sala!.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.sala!.cor_identificacao }} />
                    <span className="font-medium">{r.sala!.nome}</span>
                  </div>
                  <span className="text-muted-foreground">{r.hours.toFixed(1)}h</span>
                </div>
                <Progress value={(r.hours / maxHours) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" />Horários Mais Rentáveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {horariosPico.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados no período selecionado.</p>}
            {horariosPico.map((h) => (
              <div key={h.hour} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-mono text-sm font-medium">{h.hour}</span>
                <span className="text-sm text-muted-foreground">{h.count} agendamento(s)</span>
              </div>
            ))}
            {horariosOciosos.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Horários ociosos:</p>
                <div className="flex flex-wrap gap-1">
                  {horariosOciosos.slice(0, 8).map(h => (
                    <span key={h} className="text-xs bg-muted rounded px-2 py-0.5 font-mono">{h}</span>
                  ))}
                  {horariosOciosos.length > 8 && <span className="text-xs text-muted-foreground">+{horariosOciosos.length - 8}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" />Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximosAgendamentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento próximo.</p>}
            {proximosAgendamentos.map((ag) => {
              const cliente = clientes.find(c => c.id === ag.cliente_id);
              const sala = salas.find(s => s.id === ag.sala_id);
              return (
                <div key={ag.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                    <div>
                      <p className="text-sm font-medium">{cliente?.nome_razao_social}</p>
                      <p className="text-xs text-muted-foreground">{sala?.nome} · {new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {ag.hora_inicio} – {ag.hora_fim}</p>
                    </div>
                  </div>
                  <StatusBadge status={ag.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receita Bruta (contratos ativos)</span>
              <span className="font-semibold">R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receita Líquida</span>
              <span className="font-semibold">R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_liquido, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total em Taxas</span>
              <span className="font-semibold text-destructive">– R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_taxa, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">MRR (Receita Recorrente Mensal)</span>
              <span className="font-semibold text-primary">R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_liquido, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ticket Médio</span>
              <span className="font-semibold">R$ {contratosAtivos.length > 0 ? (contratosAtivos.reduce((acc, c) => acc + c.valor_total, 0) / contratosAtivos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</span>
            </div>
            {faturasAtrasadas.length > 0 && (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-destructive font-medium">Inadimplência ({faturasAtrasadas.length} fatura(s))</span>
                <span className="font-semibold text-destructive">R$ {faturasAtrasadas.reduce((s, f) => s + f.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
