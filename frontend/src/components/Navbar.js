import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);

  const formatMoney = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      return numberValue.toFixed(2);
    }
    return '0.00';
  };

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
              <span className="user-name">
                {usuario.nombre && usuario.apellido
                  ? `${usuario.nombre} ${usuario.apellido}`
                  : usuario.nombre || usuario.apellido || 'Usuario'}
              </span>
              <span className="user-balance">Balance: ${formatMoney(usuario?.saldo)}</span>
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
              
              {/* Mostrar Admin Panel solo si el usuario es admin */}
              {usuario.rol === 'admin' && (
                <Link to="/admin" className="nav-link admin-link">⚙️ Admin Panel</Link>
              )}
              
              <Link to="/perfil" className="nav-link">👤 Perfil</Link>
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
        <div className="navbar-footer">
          <a href="/politica_privacidad.md" target="_blank" rel="noopener noreferrer" className="nav-link priv-link">
            Política de Privacidad
          </a>
        </div>
      </div>
    </nav>
  );
}
