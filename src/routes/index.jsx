import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/login';
import ForgotPassword from '../pages/login/ForgotPassword';
import TermsOfUse from '../pages/legal/TermsOfUse';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Colaboradores from '../pages/colaboradores';
import Documentacao from '../pages/documentacao';
import Importacao from '../pages/importacao';
import Ferias from '../pages/ferias';
import Movimentacoes from '../pages/movimentacoes';
import Ausencias from '../pages/ausencias';
import Configuracoes from '../pages/configuracoes';
import Auditoria from '../pages/auditoria';
import Ocorrencias from '../pages/ocorrencias';
import Compliance from '../pages/compliance';
import GestaoPonto from '../pages/ponto';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

export function AppRoutes() {
  return (
    <BrowserRouter>
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
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}