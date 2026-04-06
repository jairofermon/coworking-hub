import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, ShieldCheck, ShieldOff, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logAudit } from '@/lib/audit';

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  approved: boolean;
  isAdmin: boolean;
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('user_id, full_name, approved');
      if (error) throw error;

      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      // Get emails from auth - we'll use the profiles and match
      const userRows: UserRow[] = (profiles ?? []).map((p: any) => {
        const isAdmin = roles?.some((r: any) => r.user_id === p.user_id && r.role === 'admin') ?? false;
        return {
          user_id: p.user_id,
          full_name: p.full_name || '(sem nome)',
          email: '', // will be filled below
          approved: p.approved,
          isAdmin,
        };
      });

      // Fetch emails via auth admin - not available, so we'll use audit_log or just show user_id
      // Actually we can get it from the current user's context + audit logs
      // Simpler: store email in profiles. For now, let's use a workaround
      // We'll query audit_log for unique emails
      const { data: auditEmails } = await supabase.from('audit_log').select('user_id, user_email');
      const emailMap = new Map<string, string>();
      auditEmails?.forEach((a: any) => { if (a.user_email) emailMap.set(a.user_id, a.user_email); });

      // Also add current user
      if (currentUser) emailMap.set(currentUser.id, currentUser.email);

      userRows.forEach(u => { u.email = emailMap.get(u.user_id) ?? ''; });

      setUsers(userRows);
    } catch (e: any) {
      toast.error('Erro ao carregar usuários: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleToggleApproval(u: UserRow) {
    try {
      const { error } = await supabase.from('profiles').update({ approved: !u.approved }).eq('user_id', u.user_id);
      if (error) throw error;
      await logAudit(u.approved ? 'reprovar_usuario' : 'aprovar_usuario', 'usuario', u.user_id, { email: u.email });
      toast.success(u.approved ? 'Acesso revogado' : 'Usuário aprovado');
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleToggleAdmin(u: UserRow) {
    try {
      if (u.isAdmin) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', u.user_id).eq('role', 'admin');
        if (error) throw error;
        // Ensure they still have 'user' role
        await supabase.from('user_roles').upsert({ user_id: u.user_id, role: 'user' }, { onConflict: 'user_id,role' });
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: u.user_id, role: 'admin' });
        if (error) throw error;
      }
      await logAudit(u.isAdmin ? 'rebaixar_admin' : 'promover_admin', 'usuario', u.user_id, { email: u.email });
      toast.success(u.isAdmin ? 'Rebaixado para usuário comum' : 'Promovido a administrador');
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(u: UserRow) {
    if (u.user_id === currentUser?.id) { toast.error('Você não pode remover a si mesmo'); return; }
    try {
      // Delete profile (cascade will handle user_roles too via FK)
      const { error } = await supabase.from('profiles').delete().eq('user_id', u.user_id);
      if (error) throw error;
      await logAudit('remover_usuario', 'usuario', u.user_id, { email: u.email });
      toast.success('Usuário removido');
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="page-container">
      <PageHeader titulo="Usuários" subtitulo="Gerencie os usuários do sistema" />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum usuário cadastrado.</TableCell></TableRow>}
            {users.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email || u.user_id.slice(0, 8) + '...'}</TableCell>
                <TableCell>
                  {u.approved
                    ? <Badge variant="default" className="bg-green-600">Aprovado</Badge>
                    : <Badge variant="secondary">Pendente</Badge>
                  }
                </TableCell>
                <TableCell>
                  {u.isAdmin
                    ? <Badge variant="default">Admin</Badge>
                    : <Badge variant="outline">Usuário</Badge>
                  }
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleApproval(u)}>
                        {u.approved ? <><XCircle className="mr-2 h-4 w-4" /> Revogar acesso</> : <><CheckCircle className="mr-2 h-4 w-4" /> Aprovar</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAdmin(u)}>
                        {u.isAdmin ? <><ShieldOff className="mr-2 h-4 w-4" /> Rebaixar p/ usuário</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Promover a admin</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(u)} disabled={u.user_id === currentUser?.id}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
