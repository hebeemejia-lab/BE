import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);
  const { formatMoney } = useContext(CurrencyContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('adminSandboxMode') === 'true');

  // reusable floating dropdown for any menu section that needs to pop outside
  const FloatingDropdown = ({ label, icon, children }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="nav-dropdown">
        <button
          className={`nav-link dropdown-toggle ${open ? 'active' : ''}`}
          onClick={() => setOpen(!open)}
        >
          {icon} {label}
        </button>
        {open && <div className="dropdown-menu">{children}</div>}
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  // Close drawer automatically when switching to desktop viewport
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleDevMode = () => {
    const nextValue = !devMode;
    setDevMode(nextValue);
    localStorage.setItem('adminSandboxMode', nextValue ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('adminSandboxModeChange', { detail: nextValue }));
  };

  return (
    <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
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
      
      <div className="navbar-container">
        <div className="navbar-header">
          <Link to="/" className="navbar-logo" onClick={handleMenuClose}>
            <img src="/imagen/BE (1) (1).png" alt="BE" className="logo-img" />
            <span className="logo-text">BE</span>
          </Link>
        </div>

        {/* admin bar removed from main navbar per request */}

        {usuario ? (
          <>
            <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
              {menuOpen && (
                <div className="user-info">
                  <span className="user-name">
                    {usuario.nombre && usuario.apellido
                      ? `${usuario.nombre} ${usuario.apellido}`
                      : usuario.nombre || usuario.apellido || 'Usuario'}
                  </span>
                  <span className="user-balance">Balance: {formatMoney(usuario?.saldo)}</span>
                </div>
              )}
              
              <div className="navbar-links">
                {/* only essential links shown when drawer is closed */}
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

                {/* when drawer opens, reveal rest of menu items */}
                {menuOpen && (
                  <>
                    <div className="nav-divider" />
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

                    <div className="nav-divider" />
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
                          onClick={() => {
                            toggleDevMode();
                            setDevMenuOpen(false);
                          }}
                        >
                          {devMode ? 'Cambiar a LIVE' : 'Cambiar a DEV'}
                        </button>
                        <span className="dropdown-item" aria-hidden="true">
                          Modo actual: {devMode ? 'DEV' : 'LIVE'}
                        </span>
                      </FloatingDropdown>
                    )}

                    <div className="nav-divider" />
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
                  </>
                )}
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
  );
}
