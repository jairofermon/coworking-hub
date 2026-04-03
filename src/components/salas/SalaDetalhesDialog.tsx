import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sala, DisponibilidadeSala } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';

const DIAS_SEMANA: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta',
  4: 'Quinta', 5: 'Sexta', 6: 'Sábado',
};

const DIAS_ORDEM = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sala: Sala | null;
  disponibilidades: DisponibilidadeSala[];
}

export function SalaDetalhesDialog({ open, onOpenChange, sala, disponibilidades }: Props) {
  if (!sala) return null;

  const disps = disponibilidades.filter(d => d.sala_id === sala.id && d.ativo);
  const dispsPorDia = DIAS_ORDEM.map(dia => ({
    dia,
    nome: DIAS_SEMANA[dia],
    intervalos: disps.filter(d => d.dia_semana === dia).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sala.cor_identificacao }} />
            {sala.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Descrição</p>
              <p className="font-medium">{sala.descricao || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <div className="mt-0.5"><StatusBadge status={sala.ativo} /></div>
            </div>
            {sala.observacao && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Observação</p>
                <p className="font-medium">{sala.observacao}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Disponibilidade semanal</h4>
            <div className="space-y-1.5">
              {dispsPorDia.map(({ dia, nome, intervalos }) => (
                <div key={dia} className="flex items-center gap-3 text-sm">
                  <span className={`w-20 font-medium ${intervalos.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {nome}
                  </span>
                  {intervalos.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {intervalos.map(i => (
                        <Badge key={i.id} variant="secondary" className="font-mono text-xs">
                          {i.hora_inicio} – {i.hora_fim}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Indisponível</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
