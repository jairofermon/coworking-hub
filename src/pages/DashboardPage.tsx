import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { mockSalas, mockClientes, mockContratos, mockAgendamentos } from '@/data/mock';
import { DoorOpen, Users, FileText, CalendarDays, TrendingUp, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

const stats = [
  { label: 'Salas Ativas', value: mockSalas.filter(s => s.ativo).length, total: mockSalas.length, icon: DoorOpen, color: 'text-primary' },
  { label: 'Clientes', value: mockClientes.length, icon: Users, color: 'text-primary' },
  { label: 'Contratos Ativos', value: mockContratos.filter(c => c.status === 'ativo').length, icon: FileText, color: 'text-success' },
  { label: 'Agendamentos Hoje', value: mockAgendamentos.filter(a => a.data === '2024-04-03').length, icon: CalendarDays, color: 'text-warning' },
];

export default function DashboardPage() {
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
                {stat.total !== undefined && (
                  <span className="text-sm font-normal text-muted-foreground">/{stat.total}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAgendamentos.map((ag) => {
              const cliente = mockClientes.find(c => c.id === ag.cliente_id);
              const sala = mockSalas.find(s => s.id === ag.sala_id);
              return (
                <div key={ag.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: sala?.cor_identificacao }} />
                    <div>
                      <p className="text-sm font-medium">{cliente?.nome_razao_social}</p>
                      <p className="text-xs text-muted-foreground">{sala?.nome} · {ag.hora_inicio} - {ag.hora_fim}</p>
                    </div>
                  </div>
                  <StatusBadge status={ag.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Resumo rápido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receita Bruta (contratos ativos)</span>
              <span className="font-semibold">
                R$ {mockContratos.filter(c => c.status === 'ativo').reduce((acc, c) => acc + c.valor_total, 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receita Líquida</span>
              <span className="font-semibold">
                R$ {mockContratos.filter(c => c.status === 'ativo').reduce((acc, c) => acc + c.valor_liquido, 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total em Taxas</span>
              <span className="font-semibold text-destructive">
                - R$ {mockContratos.filter(c => c.status === 'ativo').reduce((acc, c) => acc + c.valor_taxa, 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">Os valores são baseados nos contratos ativos. Implemente o backend para dados em tempo real.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
