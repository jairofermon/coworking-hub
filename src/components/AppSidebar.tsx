import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  FileText,
  CalendarDays,
  CalendarRange,
  Settings,
  CreditCard,
  ListChecks,
  ShieldCheck,
  ScrollText,
  LogOut,
  UserCircle,
  Receipt,
  ClipboardList,
  UserPlus,
  Bell,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [incompleteClientCount, setIncompleteClientCount] = useState(0);

  const isAdmin = user?.isAdmin ?? false;
  const isCliente = user?.isCliente ?? false;

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchPending() {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approved', false);
      setPendingCount(count ?? 0);
    }
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    if (isCliente) return;
    async function fetchIncomplete() {
      const { data } = await supabase
        .from('clientes')
        .select('id, cpf_cnpj, telefone, email, endereco_completo');
      if (data) {
        const incomplete = data.filter(c =>
          !c.cpf_cnpj || !c.telefone || !c.email || !c.endereco_completo
        );
        setIncompleteClientCount(incomplete.length);
      }
    }
    fetchIncomplete();
    const interval = setInterval(fetchIncomplete, 30000);
    return () => clearInterval(interval);
  }, [isCliente]);

  // Build menu items based on role
  const mainItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard, show: !isCliente },
    { title: 'Salas', url: '/salas', icon: DoorOpen, show: true },
    { title: 'Clientes', url: '/clientes', icon: Users, show: !isCliente },
    { title: 'Contratos', url: '/contratos', icon: FileText, show: true },
    { title: 'Agendamentos', url: '/agendamentos', icon: CalendarDays, show: true },
    { title: 'Calendário', url: '/calendario', icon: CalendarRange, show: true },
    { title: 'Faturas', url: '/faturas', icon: Receipt, show: true },
    { title: 'Logs de Uso', url: '/logs', icon: ClipboardList, show: true },
  ].filter(i => i.show);

  const configItems = [
    { title: 'Planos', url: '/configuracoes/planos', icon: ListChecks },
    { title: 'Formas de Pagamento', url: '/configuracoes/formas-pagamento', icon: CreditCard },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
              CM
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight">
                CM Coworking
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="mt-2 space-y-0.5">
              <a
                href="https://maps.google.com/?q=Av.+Jovita+Feitosa,+3184+-+A+-+Parquelândia,+Fortaleza+-+CE,+60455-410"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 text-[10px] text-muted-foreground hover:text-sidebar-accent-foreground transition-colors"
              >
                <span className="shrink-0">📍</span>
                <span>Av. Jovita Feitosa, 3184-A, Parquelândia</span>
              </a>
              <a
                href="https://linktr.ee/cmcoworking?utm_source=linktree_profile_share"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-sidebar-accent-foreground transition-colors"
              >
                <span className="shrink-0">🔗</span>
                <span>Nossos links</span>
              </a>
            </div>
          )}
        </div>

        {/* Admin notification at the top */}
        {isAdmin && pendingCount > 0 && (
          <div className="px-3 pt-3">
            <NavLink to="/admin/usuarios" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
                <Bell className="h-4 w-4 text-destructive shrink-0" />
                {!collapsed && (
                  <span className="text-destructive font-medium">
                    {pendingCount} cadastro(s) pendente(s)
                  </span>
                )}
                {collapsed && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
                    {pendingCount}
                  </span>
                )}
              </div>
            </NavLink>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/'} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="mr-2 h-3.5 w-3.5" />
            {!collapsed && 'Configurações'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              {!collapsed && 'Administração'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/usuarios" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <UserPlus className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>Usuários</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/auditoria" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <ScrollText className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>Log de Auditoria</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto border-t border-sidebar-border">
          <div className="p-3">
            {!collapsed && user && (
              <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/minha-conta" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <UserCircle className="mr-2 h-4 w-4 shrink-0" />
                    {!collapsed && <span>Minha Conta</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
