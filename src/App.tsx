import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SalasPage from "./pages/SalasPage";
import ClientesPage from "./pages/ClientesPage";
import ContratosPage from "./pages/ContratosPage";
import AgendamentosPage from "./pages/AgendamentosPage";
import CalendarioPage from "./pages/CalendarioPage";
import PlanosPage from "./pages/PlanosPage";
import FormasPagamentoPage from "./pages/FormasPagamentoPage";
import MinhaContaPage from "./pages/MinhaContaPage";
import AuditLogPage from "./pages/AuditLogPage";
import ClienteDetalhePage from "./pages/ClienteDetalhePage";
import FaturasPage from "./pages/FaturasPage";
import LogsPage from "./pages/LogsPage";
import UsuariosPage from "./pages/UsuariosPage";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, session } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!session) return <Navigate to="/login" replace />;

  if (user && !user.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">CM</div></div>
          <h2 className="text-xl font-semibold">Aguardando aprovação</h2>
          <p className="text-muted-foreground">Sua conta foi criada, mas ainda não foi aprovada por um administrador. Tente novamente mais tarde.</p>
          <button className="text-primary underline text-sm" onClick={() => { import('@/integrations/supabase/client').then(m => m.supabase.auth.signOut()); }}>Sair</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireNotCliente({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.isCliente) return <Navigate to="/agendamentos" replace />;
  return <>{children}</>;
}

function ClienteRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.isCliente) return <Navigate to="/agendamentos" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route path="/" element={<ClienteRedirect><DashboardPage /></ClienteRedirect>} />
        <Route path="/salas" element={<SalasPage />} />
        <Route path="/clientes" element={<RequireNotCliente><ClientesPage /></RequireNotCliente>} />
        <Route path="/clientes/:id" element={<RequireNotCliente><ClienteDetalhePage /></RequireNotCliente>} />
        <Route path="/contratos" element={<ContratosPage />} />
        <Route path="/agendamentos" element={<AgendamentosPage />} />
        <Route path="/calendario" element={<CalendarioPage />} />
        <Route path="/faturas" element={<FaturasPage />} />
        <Route path="/configuracoes/planos" element={<PlanosPage />} />
        <Route path="/configuracoes/formas-pagamento" element={<FormasPagamentoPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/minha-conta" element={<MinhaContaPage />} />
        <Route path="/admin/usuarios" element={<RequireAdmin><UsuariosPage /></RequireAdmin>} />
        <Route path="/admin/auditoria" element={<RequireAdmin><AuditLogPage /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
