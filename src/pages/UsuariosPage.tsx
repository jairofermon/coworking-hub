import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, ShieldCheck, ShieldOff, Trash2, Loader2, UserCheck, Users2 } from 'lucide-react';
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
  isCliente: boolean;
  hasClienteRecord: boolean;
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('user_id, full_name, email, approved');
      if (error) throw error;

      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const { data: clientes } = await supabase.from('clientes').select('id, user_id');

      const userRows: UserRow[] = (profiles ?? []).map((p: any) => {
        const isAdmin = roles?.some((r: any) => r.user_id === p.user_id && r.role === 'admin') ?? false;
        const isCliente = roles?.some((r: any) => r.user_id === p.user_id && r.role === 'cliente') ?? false;
        const hasClienteRecord = clientes?.some((c: any) => c.user_id === p.user_id) ?? false;
        return {
          user_id: p.user_id,
          full_name: p.full_name || '(sem nome)',
          email: p.email || '',
          approved: p.approved,
          isAdmin,
          isCliente,
          hasClienteRecord,
        };
      });

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

  async function handleSetRole(u: UserRow, targetRole: 'user' | 'cliente') {
    try {
      // Remove existing non-admin roles
      await supabase.from('user_roles').delete().eq('user_id', u.user_id).neq('role', 'admin' as any);
      
      // Insert new role
      const { error } = await supabase.from('user_roles').insert({ user_id: u.user_id, role: targetRole as any });
      if (error) throw error;

      // If setting as cliente and no client record exists, create one
      if (targetRole === 'cliente' && !u.hasClienteRecord) {
        await supabase.from('clientes').insert({
          nome_razao_social: u.full_name || u.email,
          email: u.email,
          user_id: u.user_id as any,
        });
      }

      await logAudit(targetRole === 'cliente' ? 'definir_como_cliente' : 'definir_como_usuario', 'usuario', u.user_id, { email: u.email });
      toast.success(targetRole === 'cliente' ? `${u.full_name} definido como Cliente` : `${u.full_name} definido como Usuário`);
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleToggleAdmin(u: UserRow) {
    try {
      if (u.isAdmin) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', u.user_id).eq('role', 'admin' as any);
        if (error) throw error;
        await supabase.from('user_roles').upsert({ user_id: u.user_id, role: 'user' }, { onConflict: 'user_id,role' });
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: u.user_id, role: 'admin' as any });
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
      const { error } = await supabase.from('profiles').delete().eq('user_id', u.user_id);
      if (error) throw error;
      await logAudit('remover_usuario', 'usuario', u.user_id, { email: u.email });
      toast.success('Usuário removido');
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  function getRoleBadge(u: UserRow) {
    if (u.isAdmin) return <Badge variant="default">Admin</Badge>;
    if (u.isCliente) return <Badge className="bg-blue-600 hover:bg-blue-700">Cliente</Badge>;
    return <Badge variant="outline">Usuário</Badge>;
  }

  if (loading) return <div className="page-container flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="page-container">
      <PageHeader titulo="Usuários" subtitulo="Gerencie os usuários do sistema" />

      {pendingUsers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {pendingUsers.length}
            </span>
            Cadastro(s) pendente(s) de aprovação
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.user_id} className="bg-destructive/5">
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { handleSetRole(u, 'user'); handleToggleApproval(u); }}>
                          <Users2 className="mr-1 h-3 w-3" /> Aprovar como Usuário
                        </Button>
                        <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => { handleSetRole(u, 'cliente'); handleToggleApproval(u); }}>
                          <UserCheck className="mr-1 h-3 w-3" /> Aprovar como Cliente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

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
            {approvedUsers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum usuário aprovado.</TableCell></TableRow>}
            {approvedUsers.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email || u.user_id.slice(0, 8) + '...'}</TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-600">Aprovado</Badge>
                </TableCell>
                <TableCell>{getRoleBadge(u)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleApproval(u)}>
                        <XCircle className="mr-2 h-4 w-4" /> Revogar acesso
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSetRole(u, 'user')}>
                        <Users2 className="mr-2 h-4 w-4" /> Definir como Usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSetRole(u, 'cliente')}>
                        <UserCheck className="mr-2 h-4 w-4" /> Definir como Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAdmin(u)}>
                        {u.isAdmin ? <><ShieldOff className="mr-2 h-4 w-4" /> Rebaixar de admin</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Promover a admin</>}
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
