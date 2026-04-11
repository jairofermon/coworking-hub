import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
}

const ACTION_LABELS: Record<string, string> = {
  criar: 'Criou', editar: 'Editou', excluir: 'Excluiu',
  ativar: 'Ativou', desativar: 'Desativou',
  aprovar_usuario: 'Aprovou usuário', reprovar_usuario: 'Revogou acesso',
  promover_admin: 'Promoveu a admin', rebaixar_admin: 'Rebaixou de admin',
  remover_usuario: 'Removeu usuário', login: 'Login',
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [{ data, error }, { data: profs }] = await Promise.all([
          supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
          supabase.from('profiles').select('user_id, full_name'),
        ]);
        if (error) throw error;
        setEntries((data ?? []) as AuditEntry[]);
        setProfiles((profs ?? []) as Profile[]);
      } catch (e: any) {
        toast.error('Erro ao carregar log: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Log de Auditoria" subtitulo="Registro de todas as ações realizadas no sistema" />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>}
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-sm">{profiles.find(p => p.user_id === e.user_id)?.full_name || e.user_email || '—'}</TableCell>
                <TableCell><Badge variant="outline">{ACTION_LABELS[e.action] ?? e.action}</Badge></TableCell>
                <TableCell className="text-sm capitalize">{e.entity_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                  {e.details && Object.keys(e.details).length > 0
                    ? Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
