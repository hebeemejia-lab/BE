import Perfil from './pages/Perfil';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import ActivosPasivos from './pages/ActivosPasivos';
import EconomiaEmergente from './pages/EconomiaEmergente';
import BeneficiosAhorro from './pages/BeneficiosAhorro';

// Estilos
import './styles/global.css';

function App() {
  const [chatbotAbierto, setChatbotAbierto] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <Navbar onAbrirChatbot={() => setChatbotAbierto(true)} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="/reenviar-verificacion" element={<ResendVerification />} />
          
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
           <Route path="/cursos/activos-pasivos" element={<ActivosPasivos />} />
           <Route path="/cursos/economia-emergente" element={<EconomiaEmergente />} />
           <Route path="/cursos/beneficios-ahorro" element={<BeneficiosAhorro />} />
          
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
    </Router>
  );
}

export default App;
