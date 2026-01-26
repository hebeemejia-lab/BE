import Perfil from './pages/Perfil';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transferencias from './pages/Transferencias';
import TransferenciaBancaria from './pages/TransferenciaBancaria';
import Recargas from './pages/Recargas';
import Retiros from './pages/Retiros';
import VincularCuenta from './pages/VincularCuenta';
import Prestamos from './pages/Prestamos';

// Estilos
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
