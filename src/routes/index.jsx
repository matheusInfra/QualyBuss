import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/login';
<<<<<<< HEAD
import ForgotPassword from '../pages/login/ForgotPassword';
import TermsOfUse from '../pages/legal/TermsOfUse';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
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
<<<<<<< HEAD
import Compliance from '../pages/compliance';
import GestaoPonto from '../pages/ponto';
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
<<<<<<< HEAD
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f

        {/* Rotas protegidas com Layout */}
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
<<<<<<< HEAD
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/ponto" element={<GestaoPonto />} />
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}