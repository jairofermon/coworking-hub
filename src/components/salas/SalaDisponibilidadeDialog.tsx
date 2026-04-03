import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Sala, DisponibilidadeSala } from '@/types';
import { toast } from 'sonner';

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

interface Intervalo {
  id: string;
  hora_inicio: string;
  hora_fim: string;
}

interface DiaConfig {
  ativo: boolean;
  intervalos: Intervalo[];
}

type SemanaConfig = Record<number, DiaConfig>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sala: Sala | null;
  disponibilidades: DisponibilidadeSala[];
  onSave: (salaId: string, disps: DisponibilidadeSala[]) => void;
}

function criarIntervalo(): Intervalo {
  return { id: crypto.randomUUID(), hora_inicio: '08:00', hora_fim: '18:00' };
}

function inicializarSemana(disps: DisponibilidadeSala[]): SemanaConfig {
  const semana: SemanaConfig = {};
  DIAS_SEMANA.forEach(d => {
    const intervalos = disps
      .filter(disp => disp.dia_semana === d.value && disp.ativo)
      .map(disp => ({ id: disp.id, hora_inicio: disp.hora_inicio, hora_fim: disp.hora_fim }));
    semana[d.value] = {
      ativo: intervalos.length > 0,
      intervalos: intervalos.length > 0 ? intervalos : [],
    };
  });
  return semana;
}

function temSobreposicao(intervalos: Intervalo[]): boolean {
  const sorted = [...intervalos].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].hora_inicio < sorted[i - 1].hora_fim) return true;
  }
  return false;
}

function horarioValido(intervalo: Intervalo): boolean {
  return intervalo.hora_inicio < intervalo.hora_fim;
}

const HORAS = Array.from({ length: 49 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

export function SalaDisponibilidadeDialog({ open, onOpenChange, sala, disponibilidades, onSave }: Props) {
  const [semana, setSemana] = useState<SemanaConfig>({});

  useEffect(() => {
    if (sala && open) {
      const disps = disponibilidades.filter(d => d.sala_id === sala.id);
      setSemana(inicializarSemana(disps));
    }
  }, [sala, open, disponibilidades]);

  function toggleDia(dia: number) {
    setSemana(prev => {
      const atual = prev[dia];
      return {
        ...prev,
        [dia]: {
          ativo: !atual.ativo,
          intervalos: !atual.ativo && atual.intervalos.length === 0 ? [criarIntervalo()] : atual.intervalos,
        },
      };
    });
  }

  function addIntervalo(dia: number) {
    setSemana(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        intervalos: [...prev[dia].intervalos, criarIntervalo()],
      },
    }));
  }

  function removeIntervalo(dia: number, id: string) {
    setSemana(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        intervalos: prev[dia].intervalos.filter(i => i.id !== id),
      },
    }));
  }

  function updateIntervalo(dia: number, id: string, field: 'hora_inicio' | 'hora_fim', value: string) {
    setSemana(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        intervalos: prev[dia].intervalos.map(i => i.id === id ? { ...i, [field]: value } : i),
      },
    }));
  }

  function handleSave() {
    if (!sala) return;
    // Validate
    for (const d of DIAS_SEMANA) {
      const config = semana[d.value];
      if (!config?.ativo) continue;
      for (const intervalo of config.intervalos) {
        if (!horarioValido(intervalo)) {
          toast.error(`${d.label}: horário de início deve ser menor que o fim`);
          return;
        }
      }
      if (temSobreposicao(config.intervalos)) {
        toast.error(`${d.label}: há sobreposição de horários`);
        return;
      }
    }

    const novasDisps: DisponibilidadeSala[] = [];
    for (const d of DIAS_SEMANA) {
      const config = semana[d.value];
      if (!config?.ativo) continue;
      for (const intervalo of config.intervalos) {
        novasDisps.push({
          id: intervalo.id,
          sala_id: sala.id,
          dia_semana: d.value,
          hora_inicio: intervalo.hora_inicio,
          hora_fim: intervalo.hora_fim,
          ativo: true,
        });
      }
    }

    onSave(sala.id, novasDisps);
    toast.success('Disponibilidade atualizada com sucesso!');
    onOpenChange(false);
  }

  if (!sala) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sala.cor_identificacao }} />
            Disponibilidade — {sala.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {DIAS_SEMANA.map(dia => {
            const config = semana[dia.value];
            if (!config) return null;
            const sobreposicao = config.ativo && temSobreposicao(config.intervalos);

            return (
              <div
                key={dia.value}
                className={`rounded-lg border p-3 transition-colors ${config.ativo ? 'bg-card' : 'bg-muted/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={config.ativo} onCheckedChange={() => toggleDia(dia.value)} />
                    <Label className={`font-medium ${config.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {dia.label}
                    </Label>
                  </div>
                  {config.ativo && (
                    <Button variant="ghost" size="sm" onClick={() => addIntervalo(dia.value)} className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Intervalo
                    </Button>
                  )}
                </div>

                {config.ativo && (
                  <div className="mt-3 space-y-2 pl-11">
                    {config.intervalos.map((intervalo) => {
                      const invalido = !horarioValido(intervalo);
                      return (
                        <div key={intervalo.id} className="flex items-center gap-2">
                          <select
                            value={intervalo.hora_inicio}
                            onChange={e => updateIntervalo(dia.value, intervalo.id, 'hora_inicio', e.target.value)}
                            className={`h-9 rounded-md border px-2 text-sm bg-background ${invalido ? 'border-destructive' : 'border-input'}`}
                          >
                            {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <span className="text-muted-foreground text-sm">até</span>
                          <select
                            value={intervalo.hora_fim}
                            onChange={e => updateIntervalo(dia.value, intervalo.id, 'hora_fim', e.target.value)}
                            className={`h-9 rounded-md border px-2 text-sm bg-background ${invalido ? 'border-destructive' : 'border-input'}`}
                          >
                            {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          {config.intervalos.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeIntervalo(dia.value, intervalo.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {sobreposicao && (
                      <p className="text-xs text-destructive">⚠ Há sobreposição de horários neste dia</p>
                    )}
                  </div>
                )}

                {!config.ativo && (
                  <p className="text-xs text-muted-foreground pl-11 mt-1">Indisponível</p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar disponibilidade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
