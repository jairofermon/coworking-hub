import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import SalasPage from "./pages/SalasPage";
import ClientesPage from "./pages/ClientesPage";
import ContratosPage from "./pages/ContratosPage";
import AgendamentosPage from "./pages/AgendamentosPage";
import CalendarioPage from "./pages/CalendarioPage";
import PlanosPage from "./pages/PlanosPage";
import FormasPagamentoPage from "./pages/FormasPagamentoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/salas" element={<SalasPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/contratos" element={<ContratosPage />} />
            <Route path="/agendamentos" element={<AgendamentosPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/configuracoes/planos" element={<PlanosPage />} />
            <Route path="/configuracoes/formas-pagamento" element={<FormasPagamentoPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
