import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { mockSalas as initialSalas, mockDisponibilidades as initialDisps } from '@/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Calendar, Power } from 'lucide-react';
import { toast } from 'sonner';
import { Sala, DisponibilidadeSala } from '@/types';
import { SalaFormDialog } from '@/components/salas/SalaFormDialog';
import { SalaDeleteDialog } from '@/components/salas/SalaDeleteDialog';
import { SalaDisponibilidadeDialog } from '@/components/salas/SalaDisponibilidadeDialog';
import { SalaDetalhesDialog } from '@/components/salas/SalaDetalhesDialog';

const DIAS_SEMANA_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
};

export default function SalasPage() {
  const [salas, setSalas] = useState<Sala[]>(initialSalas);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeSala[]>(initialDisps);
  const [busca, setBusca] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSala, setDeletingSala] = useState<Sala | null>(null);
  const [dispOpen, setDispOpen] = useState(false);
  const [dispSala, setDispSala] = useState<Sala | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhesSala, setDetalhesSala] = useState<Sala | null>(null);

  const salasFiltradas = salas.filter(s =>
    s.nome.toLowerCase().includes(busca.toLowerCase()) ||
    s.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  function handleSaveSala(sala: Sala) {
    setSalas(prev => {
      const idx = prev.findIndex(s => s.id === sala.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = sala;
        return updated;
      }
      return [...prev, sala];
    });
  }

  function handleDelete() {
    if (!deletingSala) return;
    setSalas(prev => prev.filter(s => s.id !== deletingSala.id));
    setDisponibilidades(prev => prev.filter(d => d.sala_id !== deletingSala.id));
    toast.success(`Sala "${deletingSala.nome}" excluída`);
    setDeleteOpen(false);
    setDeletingSala(null);
  }

  function handleToggleAtivo(sala: Sala) {
    setSalas(prev => prev.map(s => s.id === sala.id ? { ...s, ativo: !s.ativo } : s));
    toast.success(sala.ativo ? `"${sala.nome}" desativada` : `"${sala.nome}" ativada`);
  }

  function handleSaveDisponibilidade(salaId: string, disps: DisponibilidadeSala[]) {
    setDisponibilidades(prev => [...prev.filter(d => d.sala_id !== salaId), ...disps]);
  }

  function getDiasDisponiveis(salaId: string) {
    const disps = disponibilidades.filter(d => d.sala_id === salaId && d.ativo);
    const dias = [...new Set(disps.map(d => d.dia_semana))].sort((a, b) => {
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a) - order.indexOf(b);
    });
    return dias;
  }

  return (
    <div className="page-container">
      <PageHeader
        titulo="Salas"
        subtitulo="Gerencie as salas disponíveis para locação"
        acaoPrincipal={{
          label: 'Nova Sala',
          icon: Plus,
          onClick: () => { setEditingSala(null); setFormOpen(true); },
        }}
      />

      <FilterBar placeholder="Buscar sala por nome ou descrição..." value={busca} onChange={setBusca} />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Disponibilidade</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {salasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  {busca ? 'Nenhuma sala encontrada para esta busca.' : 'Nenhuma sala cadastrada.'}
                </TableCell>
              </TableRow>
            )}
            {salasFiltradas.map((sala) => {
              const dias = getDiasDisponiveis(sala.id);
              return (
                <TableRow key={sala.id} className="group">
                  <TableCell>
                    <div className="h-4 w-4 rounded-full ring-1 ring-border" style={{ backgroundColor: sala.cor_identificacao }} />
                  </TableCell>
                  <TableCell className="font-medium">{sala.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{sala.descricao || '—'}</TableCell>
                  <TableCell><StatusBadge status={sala.ativo} /></TableCell>
                  <TableCell>
                    {dias.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {dias.map(d => (
                          <Badge key={d} variant="secondary" className="text-xs font-normal">
                            {DIAS_SEMANA_SHORT[d]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não configurada</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{sala.observacao || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setDetalhesSala(sala); setDetalhesOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingSala(sala); setFormOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setDispSala(sala); setDispOpen(true); }}>
                          <Calendar className="mr-2 h-4 w-4" /> Configurar disponibilidade
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleAtivo(sala)}>
                          <Power className="mr-2 h-4 w-4" />
                          {sala.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeletingSala(sala); setDeleteOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Dialogs */}
      <SalaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sala={editingSala}
        onSave={handleSaveSala}
      />
      <SalaDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        sala={deletingSala}
        onConfirm={handleDelete}
      />
      <SalaDisponibilidadeDialog
        open={dispOpen}
        onOpenChange={setDispOpen}
        sala={dispSala}
        disponibilidades={disponibilidades}
        onSave={handleSaveDisponibilidade}
      />
      <SalaDetalhesDialog
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        sala={detalhesSala}
        disponibilidades={disponibilidades}
      />
    </div>
  );
}
