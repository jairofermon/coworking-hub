import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Agendamento, Cliente, Sala, Contrato } from '@/types';
import { fetchAgendamentos, fetchClientes, fetchSalas, fetchContratos } from '@/lib/api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isSameDay, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

export default function CalendarioPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [salaFilter, setSalaFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const [ag, cl, sl, ct] = await Promise.all([fetchAgendamentos(), fetchClientes(), fetchSalas(), fetchContratos()]);
        setAgendamentos(ag); setClientes(cl); setSalas(sl); setContratos(ct);
      } catch (e: any) { toast.error('Erro: ' + e.message); } finally { setLoading(false); }
    }
    load();
  }, []);

  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter(ag => salaFilter === 'all' || ag.sala_id === salaFilter);
  }, [agendamentos, salaFilter]);

  function navigate(dir: number) {
    if (viewMode === 'day') setCurrentDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
  }

  function getTitle() {
    if (viewMode === 'day') return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: ptBR })} — ${format(end, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  }

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 1 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate, viewMode]);

  function getAgendamentosForDay(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredAgendamentos.filter(ag => ag.data === dateStr);
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Calendário" subtitulo="Visualize agendamentos por dia, semana ou mês" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="text-sm font-semibold ml-2 capitalize">{getTitle()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={salaFilter} onValueChange={setSalaFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por sala" /></SelectTrigger>
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
          <Select value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'month' ? (
        <MonthView days={days} getAgendamentosForDay={getAgendamentosForDay} salas={salas} clientes={clientes} contratos={contratos} currentDate={currentDate} />
      ) : (
        <WeekDayView days={days} hours={HOURS} getAgendamentosForDay={getAgendamentosForDay} salas={salas} clientes={clientes} contratos={contratos} />
      )}
    </div>
  );
}

function WeekDayView({ days, hours, getAgendamentosForDay, salas, clientes, contratos }: {
  days: Date[]; hours: number[];
  getAgendamentosForDay: (d: Date) => Agendamento[];
  salas: Sala[]; clientes: Cliente[]; contratos: Contrato[];
}) {
  return (
    <Card className="overflow-auto">
      <div className="min-w-[600px]">
        <div className="grid border-b" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
          <div className="p-2 text-xs text-muted-foreground border-r" />
          {days.map(day => (
            <div key={day.toISOString()} className={`p-2 text-center border-r last:border-r-0 ${isToday(day) ? 'bg-primary/5' : ''}`}>
              <div className="text-xs text-muted-foreground capitalize">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className={`text-sm font-semibold ${isToday(day) ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid border-b" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)`, height: '60px' }}>
              <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 border-r">{String(hour).padStart(2, '0')}:00</div>
              {days.map(day => {
                const dayAgs = getAgendamentosForDay(day);
                const hourAgs = dayAgs.filter(ag => {
                  const startH = parseInt(ag.hora_inicio.split(':')[0]);
                  return startH === hour;
                });
                return (
                  <div key={day.toISOString()} className={`border-r last:border-r-0 relative ${isToday(day) ? 'bg-primary/5' : ''}`}>
                    {hourAgs.map(ag => {
                      const sala = salas.find(s => s.id === ag.sala_id);
                      const cliente = clientes.find(c => c.id === ag.cliente_id);
                      const contrato = contratos.find(c => c.id === ag.contrato_id);
                      const startH = parseInt(ag.hora_inicio.split(':')[0]);
                      const startM = parseInt(ag.hora_inicio.split(':')[1]);
                      const endH = parseInt(ag.hora_fim.split(':')[0]);
                      const endM = parseInt(ag.hora_fim.split(':')[1]);
                      const duration = (endH * 60 + endM) - (startH * 60 + startM);
                      const height = Math.max((duration / 60) * 60, 20);
                      const top = (startM / 60) * 60;
                      return (
                        <div
                          key={ag.id}
                          className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight overflow-hidden cursor-default z-10"
                          style={{
                            backgroundColor: sala?.cor_identificacao + '20',
                            borderLeft: `3px solid ${sala?.cor_identificacao}`,
                            top: `${top}px`,
                            height: `${height}px`,
                          }}
                          title={`${sala?.nome} · ${cliente?.nome_razao_social} · ${contrato?.codigo || ''} · ${ag.hora_inicio}-${ag.hora_fim}`}
                        >
                          <div className="font-semibold truncate" style={{ color: sala?.cor_identificacao }}>{sala?.nome}</div>
                          <div className="truncate">{cliente?.nome_razao_social}</div>
                          {contrato && <div className="truncate text-muted-foreground">{contrato.codigo}</div>}
                          <div className="text-muted-foreground truncate">{ag.hora_inicio}-{ag.hora_fim}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MonthView({ days, getAgendamentosForDay, salas, clientes, contratos, currentDate }: {
  days: Date[];
  getAgendamentosForDay: (d: Date) => Agendamento[];
  salas: Sala[]; clientes: Cliente[]; contratos: Contrato[]; currentDate: Date;
}) {
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const currentMonth = currentDate.getMonth();

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(d => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(day => {
          const ags = getAgendamentosForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border-r border-b last:border-r-0 p-1 ${!isCurrentMonth ? 'bg-muted/30' : ''} ${isToday(day) ? 'bg-primary/5' : ''}`}
            >
              <div className={`text-xs mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {ags.slice(0, 3).map(ag => {
                  const sala = salas.find(s => s.id === ag.sala_id);
                  const cliente = clientes.find(c => c.id === ag.cliente_id);
                  const contrato = contratos.find(c => c.id === ag.contrato_id);
                  return (
                    <div
                      key={ag.id}
                      className="text-[10px] rounded px-1 py-0.5 truncate"
                      style={{ backgroundColor: sala?.cor_identificacao + '20', color: sala?.cor_identificacao }}
                      title={`${sala?.nome} · ${cliente?.nome_razao_social} · ${contrato?.codigo || ''} (${contrato ? new Date(contrato.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') + ' — ' + new Date(contrato.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : ''}) · ${ag.hora_inicio}-${ag.hora_fim}`}
                    >
                      {ag.hora_inicio} {sala?.nome} {contrato?.codigo ? `[${contrato.codigo}]` : ''} - {cliente?.nome_razao_social?.split(' ')[0]}
                    </div>
                  );
                })}
                {ags.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{ags.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
