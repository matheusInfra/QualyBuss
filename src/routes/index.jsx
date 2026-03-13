import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Eager load componentes críticos (crédito inicial rápido)
import Layout from '../components/Layout';
import Login from '../pages/login';
import Dashboard from '../pages/Dashboard';

// Lazy load para módulos internos (Code Splitting)
const LandingPage = lazy(() => import('../pages/LandingPage'));
const ForgotPassword = lazy(() => import('../pages/login/ForgotPassword'));
const TermsOfUse = lazy(() => import('../pages/legal/TermsOfUse'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const Colaboradores = lazy(() => import('../pages/colaboradores'));
const Documentacao = lazy(() => import('../pages/documentacao'));
const Importacao = lazy(() => import('../pages/importacao'));
const Ferias = lazy(() => import('../pages/ferias'));
const Movimentacoes = lazy(() => import('../pages/movimentacoes'));
const Ausencias = lazy(() => import('../pages/ausencias'));
const Configuracoes = lazy(() => import('../pages/configuracoes'));
const Auditoria = lazy(() => import('../pages/auditoria'));
const Ocorrencias = lazy(() => import('../pages/ocorrencias'));
const Compliance = lazy(() => import('../pages/compliance'));
const GestaoPonto = lazy(() => import('../pages/ponto'));
const SalariosDashboard = lazy(() => import('../pages/salarios'));
const Organograma = lazy(() => import('../pages/organograma'));

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-slate-500 font-medium">Carregando módulo...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Private Routes */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/colaboradores" element={<Colaboradores />} />
            <Route path="/ferias" element={<Ferias />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
            <Route path="/ausencias" element={<Ausencias />} />
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/ocorrencias" element={<Ocorrencias />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/documentacao" element={<Documentacao />} />
            <Route path="/importacao" element={<Importacao />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/ponto" element={<GestaoPonto />} />
            <Route path="/salarios" element={<SalariosDashboard />} />
            <Route path="/organograma" element={<Organograma />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}