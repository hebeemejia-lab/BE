import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const { usuario, token, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const handleMenuClose = () => setMenuOpen(false);
  const toggleDevMode = () => setDevMode((prev) => !prev);
  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <React.Fragment>
      <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-header">
            <Link to="/" className="navbar-logo" onClick={handleMenuClose}>
              <img src="/imagen/BE (1) (1).png" alt="BE" className="logo-img" />
              <span className="logo-text">BE</span>
            </Link>
          </div>
          {usuario && token ? (
            <>
              <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
                <div className="user-info">
                  <span className="user-name">
                    {usuario.nombre && usuario.apellido
                      ? `${usuario.nombre} ${usuario.apellido}`
                      : usuario.nombre || usuario.apellido || 'Usuario'}
                  </span>
                  <span className="user-balance">Balance: {formatMoney(usuario?.saldo)}</span>
                </div>
                <div className="navbar-links">
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
                    Gestión de Gastos Personales
                  </Link>
                  <Link to="/dashboard" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                    <img src="/imagen/BE (17).png" alt="Dashboard" className="nav-icon" />
                    Dashboard
                  </Link>
                  <Link to="/mi-inversion" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                    <img src="/imagen/BE%20(24).png" alt="Mi Inversión" className="nav-icon" />
                    Mi Inversión
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
                  {(usuario.rol === 'admin' || usuario.rol === 'admin_lite') && (
                    <Link to="/admin" className="nav-link admin-link" onClick={handleMenuClose}>⚙️ Panel de Control</Link>
                  )}
                  {usuario.rol === 'admin' && (
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
              <div className={`navbar-overlay ${menuOpen ? 'show' : ''}`} onClick={handleMenuClose}></div>
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
    </React.Fragment>
  );
};

export default Navbar;

