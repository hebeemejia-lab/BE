import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('adminSandboxMode') === 'true');

  const formatMoney = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      return numberValue.toFixed(2);
    }
    return '0.00';
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const toggleDevMode = () => {
    const nextValue = !devMode;
    setDevMode(nextValue);
    localStorage.setItem('adminSandboxMode', nextValue ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('adminSandboxModeChange', { detail: nextValue }));
  };

  return (
    <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-header">
          <Link to="/" className="navbar-logo" onClick={handleMenuClose}>
            <img src="/imagen/BE (1) (1).png" alt="Banco Exclusivo" className="logo-img" />
            <span className="logo-text">Banco Exclusivo</span>
          </Link>

          {usuario && (
            <button 
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <img
                src="/imagen/BE (17).png"
                alt="Menu"
                className="hamburger-icon"
              />
            </button>
          )}
        </div>

        {usuario ? (
          <>
            <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
              <div className="user-info">
                <span className="user-name">
                  {usuario.nombre && usuario.apellido
                    ? `${usuario.nombre} ${usuario.apellido}`
                    : usuario.nombre || usuario.apellido || 'Usuario'}
                </span>
                <span className="user-balance">Balance: ${formatMoney(usuario?.saldo)}</span>
              </div>
              
              <div className="navbar-links">
                <Link to="/dashboard" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (17).png" alt="Dashboard" className="nav-icon" />
                  Dashboard
                </Link>
                <Link to="/recargas" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (4) (1).png" alt="Recargas" className="nav-icon" />
                  Recargas
                </Link>
                <Link to="/retiros" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (5) (1).png" alt="Retiros" className="nav-icon" />
                  Retiros
                </Link>
                <Link to="/vincular-cuenta" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (11).png" alt="Vincular Cuenta" className="nav-icon" />
                  Vincular Cuenta
                </Link>
                
                <div className="nav-dropdown">
                  <button 
                    className={`nav-link dropdown-toggle ${transactionsOpen ? 'active' : ''}`}
                    onClick={() => setTransactionsOpen(!transactionsOpen)}
                  >
                    💸 Transacciones
                  </button>
                  {transactionsOpen && (
                    <div className="dropdown-menu">
                      <Link to="/transferencias" className="dropdown-item" onClick={handleMenuClose}>
                        <img src="/imagen/BE (6) (1).png" alt="Transferencias" className="nav-icon" />
                        Transferencias
                      </Link>
                      <Link to="/transferencias-bancarias" className="dropdown-item" onClick={handleMenuClose}>
                        <img src="/imagen/BE (14).png" alt="Transf. Bancaria" className="nav-icon" />
                        Transf. Bancaria
                      </Link>
                      <Link to="/transferencias-internacionales" className="dropdown-item" onClick={handleMenuClose}>
                        <img src="/imagen/Adobe Express - file (12).png" alt="Transf. Internacional" className="nav-icon" />
                        Transf. Internacional
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link to="/prestamos" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (15).png" alt="Préstamos" className="nav-icon" />
                  Préstamos
                </Link>
                
                {usuario.rol === 'admin' && (
                  <Link to="/admin" className="nav-link admin-link" onClick={handleMenuClose}>⚙️ Admin</Link>
                )}

                {usuario.rol === 'admin' && (
                  <div className="nav-dev-toggle">
                    <div className="nav-dev-header">
                      <span>Modo desarrollo</span>
                      <span className={devMode ? 'nav-dev-badge on' : 'nav-dev-badge off'}>
                        {devMode ? 'DEV' : 'LIVE'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={devMode ? 'nav-dev-switch active' : 'nav-dev-switch'}
                      onClick={toggleDevMode}
                      aria-pressed={devMode}
                    >
                      <span className="nav-dev-dot"></span>
                      <span className="nav-dev-text">{devMode ? 'Sandbox Stripe' : 'Produccion'}</span>
                    </button>
                  </div>
                )}
                
                <Link to="/perfil" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (13).png" alt="Perfil" className="nav-icon" />
                  Perfil
                </Link>

                <Link to="/politica-privacidad" className="nav-link" onClick={handleMenuClose}>
                  🔐 Politicas de Seguridad
                </Link>
                
                <button onClick={handleLogout} className="nav-button logout-btn">
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
            {menuOpen && <div className="navbar-overlay" onClick={handleMenuClose}></div>}
          </>
        ) : (
          <div className="navbar-links">
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            <Link to="/register" className="nav-button register-btn">
              Registrarse
            </Link>
            <Link to="/politica-privacidad" className="nav-link priv-link">
              Politicas de Seguridad
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
