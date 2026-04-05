import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DoorOpen, Users, FileText, CalendarDays, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { fetchSalas, fetchClientes, fetchContratos, fetchAgendamentos, inactivateExpiredContracts } from '@/lib/api';
import { Sala, Cliente, Contrato, Agendamento } from '@/types';

export default function DashboardPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await inactivateExpiredContracts().catch(() => {});
        const [s, c, ct, ag] = await Promise.all([fetchSalas(), fetchClientes(), fetchContratos(), fetchAgendamentos()]);
        setSalas(s); setClientes(c); setContratos(ct); setAgendamentos(ag);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const today = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter(a => a.data === today);
  const contratosAtivos = contratos.filter(c => c.status === 'ativo');
  const proximosAgendamentos = agendamentos.filter(a => a.data >= today && a.status !== 'cancelado').slice(0, 5);

  const stats = [
    { label: 'Salas Ativas', value: salas.filter(s => s.ativo).length, total: salas.length, icon: DoorOpen, color: 'text-primary' },
    { label: 'Clientes', value: clientes.length, icon: Users, color: 'text-primary' },
    { label: 'Contratos Ativos', value: contratosAtivos.length, icon: FileText, color: 'text-green-600' },
    { label: 'Agendamentos Hoje', value: agendamentosHoje.length, icon: CalendarDays, color: 'text-amber-600' },
  ];

  return (
    <div className="page-container">
      <PageHeader titulo="Dashboard" subtitulo="Visão geral do CM Coworking" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                {stat.total !== undefined && <span className="text-sm font-normal text-muted-foreground">/{stat.total}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
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
                      <p className="text-xs text-muted-foreground">{sala?.nome} · {new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {ag.hora_inicio} - {ag.hora_fim}</p>
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
              <span className="font-semibold">R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_total, 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receita Líquida</span>
              <span className="font-semibold">R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_liquido, 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total em Taxas</span>
              <span className="font-semibold text-destructive">- R$ {contratosAtivos.reduce((acc, c) => acc + c.valor_taxa, 0).toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
