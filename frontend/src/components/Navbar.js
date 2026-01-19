import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏦</span>
          Banco Exclusivo
        </Link>

        {usuario ? (
          <div className="navbar-right">
            <div className="user-info">
              <span className="user-name">{usuario.nombre}</span>
              <span className="user-balance">Balance: ${usuario.saldo?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="navbar-links">
              <Link to="/dashboard" className="nav-link">📊 Dashboard</Link>
              
              {/* Servicios con dinero real */}
              <div className="nav-section">
                <span className="nav-section-label">💰 Dinero</span>
                <Link to="/recargas" className="nav-link">Recargas</Link>
                <Link to="/retiros" className="nav-link">Retiros</Link>
                <Link to="/vincular-cuenta" className="nav-link">Cuentas</Link>
                <Link to="/transferencias" className="nav-link">Transf.</Link>
                <Link to="/transferencias-bancarias" className="nav-link">Transf. Banco</Link>
                <Link to="/prestamos" className="nav-link">Préstamos</Link>
              </div>
              
              <button onClick={handleLogout} className="nav-button logout-btn">
                Cerrar Sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-links">
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            <Link to="/register" className="nav-button register-btn">
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
