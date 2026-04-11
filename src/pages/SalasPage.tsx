import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { AlertBanner } from '@/components/AlertBanner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Calendar, Power, DoorOpen, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Sala, DisponibilidadeSala, Contrato, Agendamento } from '@/types';
import { SalaFormDialog } from '@/components/salas/SalaFormDialog';
import { SalaDeleteDialog } from '@/components/salas/SalaDeleteDialog';
import { SalaDisponibilidadeDialog } from '@/components/salas/SalaDisponibilidadeDialog';
import { SalaDetalhesDialog } from '@/components/salas/SalaDetalhesDialog';
import { fetchSalas, upsertSala, deleteSala, toggleSalaAtivo, fetchDisponibilidades, saveDisponibilidades, fetchContratos, fetchAgendamentos } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/hooks/useAuth';

const DIAS_SEMANA_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'ativo', label: 'Ativas' },
  { value: 'inativo', label: 'Inativas' },
];

export default function SalasPage() {
  const { user } = useAuth();
  const isCliente = user?.isCliente ?? false;

  const [salas, setSalas] = useState<Sala[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeSala[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSala, setDeletingSala] = useState<Sala | null>(null);
  const [dispOpen, setDispOpen] = useState(false);
  const [dispSala, setDispSala] = useState<Sala | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhesSala, setDetalhesSala] = useState<Sala | null>(null);

  async function loadData() {
    try {
      const [s, d, ct, ag] = await Promise.all([fetchSalas(), fetchDisponibilidades(), fetchContratos(), fetchAgendamentos()]);
      setSalas(s); setDisponibilidades(d); setContratos(ct); setAgendamentos(ag);
    } catch (e: any) { toast.error('Erro ao carregar salas: ' + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const salasFiltradas = useMemo(() => {
    return salas.filter(s => {
      if (filtroStatus === 'ativo' && !s.ativo) return false;
      if (filtroStatus === 'inativo' && s.ativo) return false;
      if (!busca) return true;
      return s.nome.toLowerCase().includes(busca.toLowerCase()) || s.descricao.toLowerCase().includes(busca.toLowerCase());
    });
  }, [salas, busca, filtroStatus]);

  const salasInativas = useMemo(() => salas.filter(s => !s.ativo), [salas]);
  const salasSemDisp = useMemo(() => {
    return salas.filter(s => s.ativo && disponibilidades.filter(d => d.sala_id === s.id && d.ativo).length === 0);
  }, [salas, disponibilidades]);

  function getSalaVinculos(id: string) {
    return {
      contratos: contratos.filter(c => c.sala_id === id).length,
      agendamentos: agendamentos.filter(a => a.sala_id === id).length,
    };
  }

  async function handleSaveSala(sala: Sala) {
    try {
      const isNew = !sala.id;
      const saved = await upsertSala(sala);
      await logAudit(isNew ? 'criar' : 'editar', 'sala', saved.id, { nome: saved.nome });
      toast.success(isNew ? 'Sala criada com sucesso!' : 'Sala atualizada.');
      await loadData();
    } catch (e: any) { toast.error('Erro ao salvar: ' + e.message); }
  }

  async function handleDelete() {
    if (!deletingSala) return;
    const vinculos = getSalaVinculos(deletingSala.id);
    if (vinculos.contratos > 0 || vinculos.agendamentos > 0) {
      toast.error(`Não é possível excluir "${deletingSala.nome}". Existem ${vinculos.contratos} contrato(s) e ${vinculos.agendamentos} agendamento(s) vinculados. Desative a sala em vez de excluí-la.`);
      setDeleteOpen(false); setDeletingSala(null);
      return;
    }
    try {
      await deleteSala(deletingSala.id);
      await logAudit('excluir', 'sala', deletingSala.id, { nome: deletingSala.nome });
      toast.success(`Sala "${deletingSala.nome}" excluída com sucesso.`);
      setDeleteOpen(false); setDeletingSala(null); await loadData();
    } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
  }

  async function handleToggleAtivo(sala: Sala) {
    try {
      await toggleSalaAtivo(sala.id, !sala.ativo);
      await logAudit(sala.ativo ? 'desativar' : 'ativar', 'sala', sala.id, { nome: sala.nome });
      toast.success(sala.ativo ? `"${sala.nome}" desativada.` : `"${sala.nome}" ativada.`);
      await loadData();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  async function handleSaveDisponibilidade(salaId: string, disps: DisponibilidadeSala[]) {
    try { await saveDisponibilidades(salaId, disps); toast.success('Disponibilidade salva.'); await loadData(); } catch (e: any) { toast.error('Erro ao salvar disponibilidade: ' + e.message); }
  }

  function getDispsForSala(salaId: string) {
    return disponibilidades.filter(d => d.sala_id === salaId && d.ativo);
  }

  if (loading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader
        titulo="Salas"
        subtitulo={isCliente ? "Visualize as salas disponíveis" : "Gerencie as salas disponíveis para locação"}
        acaoPrincipal={!isCliente ? { label: 'Nova Sala', icon: Plus, onClick: () => { setEditingSala(null); setFormOpen(true); } } : undefined}
      />

      {!isCliente && salasSemDisp.length > 0 && (
        <AlertBanner type="warning">
          {salasSemDisp.length === 1 ? 'A sala' : `${salasSemDisp.length} salas`}{' '}
          <strong>{salasSemDisp.map(s => s.nome).join(', ')}</strong>{' '}
          {salasSemDisp.length === 1 ? 'está ativa mas não possui' : 'estão ativas mas não possuem'} disponibilidade configurada.
        </AlertBanner>
      )}

      <FilterBar placeholder="Buscar sala por nome ou descrição..." value={busca} onChange={setBusca}>
        {!isCliente && (
          <div className="flex gap-1">
            {STATUS_FILTERS.map(f => (
              <Button key={f.value} variant={filtroStatus === f.value ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setFiltroStatus(f.value)}>
                {f.label}
              </Button>
            ))}
          </div>
        )}
      </FilterBar>

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
              {!isCliente && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {salasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={isCliente ? 6 : 7}>
                  <EmptyState icon={DoorOpen} titulo={busca ? 'Nenhuma sala encontrada' : 'Nenhuma sala cadastrada'} descricao={busca ? 'Tente alterar os termos de busca.' : 'Nenhuma sala disponível no momento.'} />
                </TableCell>
              </TableRow>
            )}
            {salasFiltradas.map((sala) => {
              const disps = getDispsForSala(sala.id);
              const diasOrdem = [1, 2, 3, 4, 5, 6, 0];
              const diasUnicos = [...new Set(disps.map(d => d.dia_semana))].sort((a, b) => diasOrdem.indexOf(a) - diasOrdem.indexOf(b));
              const semDisp = sala.ativo && disps.length === 0;

              return (
                <TableRow key={sala.id} className={!sala.ativo ? 'opacity-60' : ''}>
                  <TableCell><div className="h-4 w-4 rounded-full ring-1 ring-border" style={{ backgroundColor: sala.cor_identificacao }} /></TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {sala.nome}
                      {!isCliente && semDisp && (
                        <Tooltip>
                          <TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-warning" /></TooltipTrigger>
                          <TooltipContent>Disponibilidade não configurada</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sala.descricao || '—'}</TableCell>
                  <TableCell><StatusBadge status={sala.ativo} /></TableCell>
                  <TableCell>
                    {diasUnicos.length > 0 ? (
                      <div className="space-y-0.5">
                        {diasUnicos.map(dia => {
                          const intervals = disps.filter(d => d.dia_semana === dia).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
                          return (
                            <div key={dia} className="flex items-center gap-1.5 text-xs">
                              <span className="font-medium w-8">{DIAS_SEMANA_SHORT[dia]}</span>
                              {intervals.map((i, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] font-mono px-1 py-0">
                                  {i.hora_inicio}–{i.hora_fim}
                                </Badge>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : <span className="text-xs text-muted-foreground italic">Não configurada</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{sala.observacao || '—'}</TableCell>
                  {!isCliente && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setDetalhesSala(sala); setDetalhesOpen(true); }}><Eye className="mr-2 h-4 w-4" /> Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingSala(sala); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setDispSala(sala); setDispOpen(true); }}><Calendar className="mr-2 h-4 w-4" /> Configurar disponibilidade</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleAtivo(sala)}><Power className="mr-2 h-4 w-4" />{sala.ativo ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeletingSala(sala); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {!isCliente && (
        <>
          <SalaFormDialog open={formOpen} onOpenChange={setFormOpen} sala={editingSala} onSave={handleSaveSala} />
          <SalaDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} sala={deletingSala} onConfirm={handleDelete} />
          <SalaDisponibilidadeDialog open={dispOpen} onOpenChange={setDispOpen} sala={dispSala} disponibilidades={disponibilidades} onSave={handleSaveDisponibilidade} />
        </>
      )}
      <SalaDetalhesDialog open={detalhesOpen} onOpenChange={setDetalhesOpen} sala={detalhesSala} disponibilidades={disponibilidades} />
    </div>
  );
}
