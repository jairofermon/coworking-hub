import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell, Legend } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, CalendarDays } from 'lucide-react';
import { Sala, Contrato, Agendamento, Fatura } from '@/types';

interface Props {
  salas: Sala[];
  contratos: Contrato[];
  agendamentosFiltered: Agendamento[];
  faturas: Fatura[];
  filtroDataInicio: string;
  filtroDataFim: string;
}

function calcHours(hi: string, hf: string): number {
  if (!hi || !hf) return 0;
  const [h1, m1] = hi.split(':').map(Number);
  const [h2, m2] = hf.split(':').map(Number);
  return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
}

function formatMonth(d: Date) {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function DashboardCharts({ salas, agendamentosFiltered, faturas, filtroDataInicio, filtroDataFim }: Props) {
  // Define janela de período. Se não houver filtro, usa últimos 6 meses (receita) e últimos 30 dias (agendamentos diários).
  const { inicioPeriodo, fimPeriodo } = useMemo(() => {
    const fim = filtroDataFim ? new Date(filtroDataFim + 'T00:00:00') : new Date();
    const inicio = filtroDataInicio
      ? new Date(filtroDataInicio + 'T00:00:00')
      : (() => { const d = new Date(fim); d.setMonth(d.getMonth() - 5); d.setDate(1); return d; })();
    return { inicioPeriodo: inicio, fimPeriodo: fim };
  }, [filtroDataInicio, filtroDataFim]);

  // 1. Receita mensal (faturas pagas) — agrupa por mês dentro do período
  const receitaMensal = useMemo(() => {
    const map = new Map<string, { label: string; receita: number; sortKey: string }>();
    const cursor = new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth(), 1);
    const fimMes = new Date(fimPeriodo.getFullYear(), fimPeriodo.getMonth(), 1);
    while (cursor <= fimMes) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { label: formatMonth(cursor), receita: 0, sortKey: key });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    faturas.forEach(f => {
      if (f.status !== 'pago' || !f.data_pagamento) return;
      const key = f.data_pagamento.slice(0, 7);
      const entry = map.get(key);
      if (entry) entry.receita += Number(f.valor) || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [faturas, inicioPeriodo, fimPeriodo]);

  // 2. Faturas por status (todas faturas, dentro do período por vencimento)
  const faturasPorStatus = useMemo(() => {
    const ini = inicioPeriodo.toISOString().slice(0, 10);
    const fim = fimPeriodo.toISOString().slice(0, 10);
    const inWindow = faturas.filter(f => f.data_vencimento >= ini && f.data_vencimento <= fim);
    const counts: Record<string, number> = { pago: 0, pendente: 0, atrasado: 0 };
    inWindow.forEach(f => { counts[f.status] = (counts[f.status] ?? 0) + 1; });
    return [
      { name: 'Pagas', value: counts.pago, fill: 'hsl(var(--success))' },
      { name: 'Pendentes', value: counts.pendente, fill: 'hsl(var(--warning))' },
      { name: 'Atrasadas', value: counts.atrasado, fill: 'hsl(var(--destructive))' },
    ].filter(s => s.value > 0);
  }, [faturas, inicioPeriodo, fimPeriodo]);

  // 3. Ocupação de salas (horas agendadas por sala)
  const ocupacaoSalas = useMemo(() => {
    const agAtivos = agendamentosFiltered.filter(a => a.status !== 'cancelado');
    const map = new Map<string, number>();
    agAtivos.forEach(a => map.set(a.sala_id, (map.get(a.sala_id) ?? 0) + calcHours(a.hora_inicio, a.hora_fim)));
    return salas
      .filter(s => map.has(s.id))
      .map(s => ({ name: s.nome, horas: Number((map.get(s.id) ?? 0).toFixed(1)), fill: s.cor_identificacao }))
      .sort((a, b) => b.horas - a.horas);
  }, [agendamentosFiltered, salas]);

  // 4. Agendamentos por dia (últimos 30 dias da janela)
  const agendamentosPorDia = useMemo(() => {
    const fim = new Date(fimPeriodo);
    const ini = filtroDataInicio
      ? new Date(filtroDataInicio + 'T00:00:00')
      : (() => { const d = new Date(fim); d.setDate(d.getDate() - 29); return d; })();
    const map = new Map<string, number>();
    const cursor = new Date(ini);
    while (cursor <= fim) {
      const key = cursor.toISOString().slice(0, 10);
      map.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
    }
    agendamentosFiltered.forEach(a => {
      if (a.status === 'cancelado') return;
      if (map.has(a.data)) map.set(a.data, (map.get(a.data) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([data, count]) => ({
      label: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      agendamentos: count,
    }));
  }, [agendamentosFiltered, fimPeriodo, filtroDataInicio]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Receita mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />Receita Mensal (faturas pagas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receitaMensal.every(r => r.receita === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem receitas no período.</p>
          ) : (
            <ChartContainer config={{ receita: { label: 'Receita', color: 'hsl(var(--primary))' } }} className="h-[240px] w-full">
              <BarChart data={receitaMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />} />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Faturas por status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieIcon className="h-4 w-4" />Faturas por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faturasPorStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem faturas no período.</p>
          ) : (
            <ChartContainer config={{}} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={faturasPorStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`}>
                  {faturasPorStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Ocupação de salas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />Ocupação por Sala (horas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ocupacaoSalas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem agendamentos no período.</p>
          ) : (
            <ChartContainer config={{ horas: { label: 'Horas', color: 'hsl(var(--primary))' } }} className="h-[240px] w-full">
              <BarChart data={ocupacaoSalas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={11} width={90} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}h`} />} />
                <Bar dataKey="horas" radius={[0, 4, 4, 0]}>
                  {ocupacaoSalas.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos por dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />Agendamentos por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentosPorDia.every(d => d.agendamentos === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem agendamentos no período.</p>
          ) : (
            <ChartContainer config={{ agendamentos: { label: 'Agendamentos', color: 'hsl(var(--primary))' } }} className="h-[240px] w-full">
              <LineChart data={agendamentosPorDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="agendamentos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
