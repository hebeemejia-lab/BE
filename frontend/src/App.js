import GastosPersonales from './pages/GastosPersonales';
import MiInversionPage from './pages/MiInversionPage';
import Perfil from './pages/Perfil';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBotFAQ from './components/ChatBotFAQ';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import Dashboard from './pages/Dashboard';
import Transferencias from './pages/Transferencias';
import TransferenciaBancaria from './pages/TransferenciaBancaria';
import TransferenciasInternacionales from './pages/TransferenciasInternacionales';
import Recargas from './pages/Recargas';
import Retiros from './pages/Retiros';
import VincularCuenta from './pages/VincularCuenta';
import Prestamos from './pages/Prestamos';
import AdminPanel from './pages/AdminPanel';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';
import Cursos from './pages/Cursos';
import SeleccionCurso from './pages/SeleccionCurso';
import ActivosPasivos from './pages/ActivosPasivos';
import EconomiaEmergente from './pages/EconomiaEmergente';
import BeneficiosAhorro from './pages/BeneficiosAhorro';
import Certificado from './pages/Certificado';

// Estilos
import './styles/global.css';

const getTitleForPath = (pathname) => {
  if (pathname === '/') return 'BE - Inicio';
  if (pathname.startsWith('/login')) return 'BE - Iniciar Sesion';
  if (pathname.startsWith('/register')) return 'BE - Registro';
  if (pathname.startsWith('/verificar-email')) return 'BE - Verificar Email';
  if (pathname.startsWith('/reenviar-verificacion')) return 'BE - Reenviar Verificacion';
  if (pathname.startsWith('/dashboard')) return 'BE - Dashboard';
  if (pathname.startsWith('/transferencias-internacionales')) return 'BE - Transferencias Internacionales';
  if (pathname.startsWith('/transferencias-bancarias')) return 'BE - Transferencia Bancaria';
  if (pathname.startsWith('/transferencias')) return 'BE - Transferencias';
  if (pathname.startsWith('/mi-inversion')) return 'BE - Inversion';
  if (pathname.startsWith('/gastos-personales')) return 'BE - Gastos Personales';
  if (pathname.startsWith('/recargas')) return 'BE - Recargas';
  if (pathname.startsWith('/retiros')) return 'BE - Retiros';
  if (pathname.startsWith('/vincular-cuenta')) return 'BE - Vincular Cuenta';
  if (pathname.startsWith('/prestamos')) return 'BE - Prestamos';
  if (pathname.startsWith('/perfil')) return 'BE - Perfil';
  if (pathname.startsWith('/admin')) return 'BE - Admin';
  if (pathname.startsWith('/politica-privacidad')) return 'BE - Politica de Privacidad';
  if (pathname.startsWith('/cursos/activos-pasivos')) return 'BE - Cursos Activos y Pasivos';
  if (pathname.startsWith('/cursos/economia-emergente')) return 'BE - Cursos Economia Emergente';
  if (pathname.startsWith('/cursos/beneficios-ahorro')) return 'BE - Cursos Beneficios del Ahorro';
  if (pathname.startsWith('/cursos')) return 'BE - Cursos';
  if (pathname.startsWith('/seleccion-curso')) return 'BE - Seleccion de Curso';
  if (pathname.startsWith('/certificado')) return 'BE - Certificado';
  return 'BE - Banexclusivo';
};

function TitleManager() {
  const location = useLocation();

  React.useEffect(() => {
    document.title = getTitleForPath(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  const [chatbotAbierto, setChatbotAbierto] = useState(false);

  return (
    <Router>
      <TitleManager />
      <CurrencyProvider>
        <AuthProvider>
          <Navbar onAbrirChatbot={() => setChatbotAbierto(true)} />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="/reenviar-verificacion" element={<ResendVerification />} />
          
          <Route
            path="/gastos-personales"
            element={
              <ProtectedRoute>
                <GastosPersonales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-inversion"
            element={
              <ProtectedRoute>
                <MiInversionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transferencias"
            element={
              <ProtectedRoute>
                <Transferencias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transferencias-bancarias"
            element={
              <ProtectedRoute>
                <TransferenciaBancaria />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transferencias-internacionales"
            element={
              <ProtectedRoute>
                <TransferenciasInternacionales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recargas"
            element={
              <ProtectedRoute>
                <Recargas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retiros"
            element={
              <ProtectedRoute>
                <Retiros />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vincular-cuenta"
            element={
              <ProtectedRoute>
                <VincularCuenta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prestamos"
            element={
              <ProtectedRoute>
                <Prestamos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
           <Route path="/cursos" element={<Cursos />} />
          <Route path="/seleccion-curso" element={<SeleccionCurso />} />
           <Route path="/cursos/activos-pasivos" element={<ActivosPasivos />} />
           <Route path="/cursos/economia-emergente" element={<EconomiaEmergente />} />
           <Route path="/cursos/beneficios-ahorro" element={<BeneficiosAhorro />} />
           <Route path="/certificado" element={<Certificado />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Chatbot FAQ */}
        <ChatBotFAQ 
          isOpen={chatbotAbierto} 
          onClose={() => setChatbotAbierto(false)} 
        />

        {/* Botón flotante para abrir el chatbot */}
        {!chatbotAbierto && (
          <button
            className="chatbot-fab"
            onClick={() => setChatbotAbierto(true)}
            title="¿Necesitas ayuda?"
          >
            💬
          </button>
        )}
      </AuthProvider>
      </CurrencyProvider>
    </Router>
  );
}

export default App;
