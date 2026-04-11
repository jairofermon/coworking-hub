import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, ShieldCheck, ShieldOff, Trash2, Loader2, Lock, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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

export default function MinhaContaPage() {
  const { user: currentUser } = useAuth();
  const isCliente = currentUser?.isCliente ?? false;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Editable name
  const [editName, setEditName] = useState(currentUser?.fullName ?? '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setEditName(currentUser?.fullName ?? '');
  }, [currentUser?.fullName]);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadUsers();
    }
  }, [currentUser?.isAdmin]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('user_id, full_name, email, approved');
      if (error) throw error;
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      const userRows: UserRow[] = (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name || '(sem nome)',
        email: p.email || '',
        approved: p.approved,
        isAdmin: roles?.some((r: any) => r.user_id === p.user_id && r.role === 'admin') ?? false,
      }));
      setUsers(userRows);
    } catch (e: any) {
      toast.error('Erro ao carregar usuários: ' + e.message);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleSaveName() {
    if (!editName.trim()) { toast.error('O nome não pode ficar vazio'); return; }
    setSavingName(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: editName.trim() }).eq('user_id', currentUser!.id);
      if (error) throw error;
      toast.success('Nome atualizado com sucesso!');
      // Also update auth metadata
      await supabase.auth.updateUser({ data: { full_name: editName.trim() } });
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingName(false); }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) { toast.error('A senha deve ter ao menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('As senhas não conferem'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      await logAudit('alterar_senha', 'usuario', currentUser?.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleToggleApproval(u: UserRow) {
    try {
      const { error } = await supabase.from('profiles').update({ approved: !u.approved }).eq('user_id', u.user_id);
      if (error) throw error;
      await logAudit(u.approved ? 'bloquear_usuario' : 'aprovar_usuario', 'usuario', u.user_id, { email: u.email });
      toast.success(u.approved ? 'Acesso bloqueado' : 'Usuário aprovado');
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleToggleAdmin(u: UserRow) {
    try {
      if (u.isAdmin) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', u.user_id).eq('role', 'admin');
        if (error) throw error;
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
      const { error } = await supabase.from('profiles').delete().eq('user_id', u.user_id);
      if (error) throw error;
      await logAudit('remover_usuario', 'usuario', u.user_id, { email: u.email });
      toast.success('Usuário removido');
      await loadUsers();
    } catch (e: any) { toast.error(e.message); }
  }

  const roleBadge = currentUser?.isAdmin
    ? <Badge variant="default">Admin</Badge>
    : isCliente
      ? <Badge variant="secondary">Cliente</Badge>
      : <Badge variant="outline">Usuário</Badge>;

  return (
    <div className="page-container">
      <PageHeader titulo="Minha Conta" subtitulo="Gerencie seu perfil e configurações" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Meus Dados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Nome</Label>
              <div className="flex gap-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
                <Button size="sm" onClick={handleSaveName} disabled={savingName || editName === currentUser?.fullName}>
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">E-mail</Label>
              <p className="font-medium">{currentUser?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Perfil</Label>
              <p>{roleBadge}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Alterar Senha</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
              {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </CardContent>
        </Card>
      </div>

      {currentUser?.isAdmin && (
        <>
          <Separator className="my-6" />
          <h3 className="text-lg font-semibold mb-4">Gerenciar Usuários</h3>
          <Card>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
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
                        {u.isAdmin ? <Badge variant="default">Admin</Badge> : <Badge variant="outline">Usuário</Badge>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleApproval(u)}>
                              {u.approved ? <><XCircle className="mr-2 h-4 w-4" /> Bloquear acesso</> : <><CheckCircle className="mr-2 h-4 w-4" /> Aprovar</>}
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
            )}
          </Card>
        </>
      )}
    </div>
  );
}
