import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Componente básico FloatingDropdown
const FloatingDropdown = ({ label, icon, children }) => (
  <div className="floating-dropdown">
    <span className="dropdown-label">{icon ? icon + ' ' : ''}{label}</span>
    <div className="dropdown-content dropdown-open">{children}</div>
  </div>
);

const formatMoney = (value) => `$${value}`;

const Navbar = () => {
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const rolUsuario = String(usuario?.rol || '').toLowerCase();
  const esAdmin = rolUsuario === 'admin' || rolUsuario === 'admin_lite' || rolUsuario === 'administrador';
  const esAdminFull = rolUsuario === 'admin' || rolUsuario === 'administrador';
  const [menuOpen, setMenuOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const handleMenuClose = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleDevMode = () => setDevMode((prev) => !prev);
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <React.Fragment>
      <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-header">
            <button
              type="button"
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label={menuOpen ? 'Cerrar menú de opciones' : 'Abrir menú de opciones'}
              aria-expanded={menuOpen}
              aria-controls="navbar-options"
            >
              <span className="hamburger-symbol" aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
            </button>
            <Link to="/" className="navbar-logo" onClick={handleMenuClose}>
              <img src="/imagen/BE (1) (1).png" alt="BE" className="logo-img" />
              <span className="logo-text">BE</span>
            </Link>
          </div>
          <div id="navbar-options" className={`navbar-right ${menuOpen ? 'open' : ''}`}>
            <div className="user-info">
              <span className="user-name">
                {usuario && (usuario.nombre || usuario.apellido)
                  ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()
                  : 'Usuario'}
              </span>
              <span className="user-balance">Balance: {usuario && usuario.saldo ? formatMoney(usuario.saldo) : '$0'}</span>
            </div>
            <div className="navbar-links" style={{overflowX: 'auto', whiteSpace: 'nowrap', width: '100vw', display: 'flex', gap: '8px', alignItems: 'center', height: '80px'}}>
              <Link to="/dashboard" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE (1) (1).png" alt="Dashboard" className="nav-icon" />
                Dashboard
              </Link>
              {esAdmin && (
                <Link to="/admin" className="nav-link admin-link" onClick={handleMenuClose}>⚙️ Panel de Control</Link>
              )}
              <Link to="/saldos" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE (6) (1).png" alt="Crypto Wallet" className="nav-icon" />
                Crypto Wallet
              </Link>
              <Link to="/recargas" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE (4) (1).png" alt="Deposita" className="nav-icon" />
                Deposita
              </Link>
              <Link to="/retiros" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE (5) (1).png" alt="Retiros" className="nav-icon" />
                Retiros
              </Link>
              <Link to="/gastos-personales" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE%20(23).png" alt="Gastos Personales" className="nav-icon" />
                Gastos Personales
              </Link>
              <Link to="/vincular-cuenta" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE (11).png" alt="Vincular Cuenta" className="nav-icon" />
                Vincular Cuenta
              </Link>
              <FloatingDropdown label="Transacciones" icon="💸">
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
              </FloatingDropdown>
              <Link to="/prestamos" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                <img src="/imagen/BE (15).png" alt="Préstamos" className="nav-icon" />
                Préstamos
              </Link>
              {esAdminFull && (
                <FloatingDropdown label="Desarrolladores">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={toggleDevMode}
                  >
                    {devMode ? 'Cambiar a LIVE' : 'Cambiar a DEV'}
                  </button>
                  <span className="dropdown-item" aria-hidden="true">
                    Modo actual: {devMode ? 'DEV' : 'LIVE'}
                  </span>
                </FloatingDropdown>
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
        </div>
        {menuOpen && (
          <button
            type="button"
            className="navbar-overlay"
            onClick={handleMenuClose}
            aria-label="Cerrar menú"
          />
        )}
      </nav>
    </React.Fragment>
  );
};

export default Navbar;

