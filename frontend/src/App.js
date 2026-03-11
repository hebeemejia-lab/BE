import GastosPersonales from './pages/GastosPersonales';

import MiInversionPage from './pages/MiInversionPage';

import Perfil from './pages/Perfil';

import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
import SalaDeSaldos from './pages/SalaDeSaldos';

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
import ArticuloAhorro from './pages/educacion/ArticuloAhorro';
import InclusionFinanciera from './pages/educacion/InclusionFinanciera';
import SimuladorAhorro from './pages/educacion/SimuladorAhorro';
import ActivosPasivos from './pages/ActivosPasivos';

import EconomiaEmergente from './pages/EconomiaEmergente';

import BeneficiosAhorro from './pages/BeneficiosAhorro';

import Certificado from './pages/Certificado';

import Circulos from './pages/Circulos';

import TuGrupo from './pages/TuGrupo';

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
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sala-saldos" element={<SalaDeSaldos />} />
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
    </GoogleOAuthProvider>
  );
}

// Forzar build en Render
export default App;
