import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);
  const { formatMoney } = useContext(CurrencyContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('adminSandboxMode') === 'true');

  // Referencias para detectar swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const menuOpenRef = useRef(menuOpen);

  // Mantener menuOpenRef sincronizado
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

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

  // Detectar swipe gestures en móvil
  useEffect(() => {
    // Solo en dispositivos móviles y si hay usuario logueado
    if (!usuario || window.innerWidth > 600) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const diffX = touchEndX.current - touchStartX.current;
      const diffY = Math.abs(touchEndY.current - touchStartY.current);
      
      // Solo detectar swipe horizontal (no vertical - evitar conflicto con scroll)
      if (diffY > 70) return;

      const isMenuOpen = menuOpenRef.current;

      // Swipe desde el borde izquierdo hacia la derecha (ABRIR menú)
      if (!isMenuOpen && touchStartX.current < 50 && diffX > 80) {
        setMenuOpen(true);
      }
      
      // Swipe hacia la izquierda (CERRAR menú) - desde cualquier parte cuando está abierto
      if (isMenuOpen && diffX < -80) {
        setMenuOpen(false);
      }
      
      // Swipe hacia la derecha desde dentro del menú también puede cerrarlo si es muy fuerte
      if (isMenuOpen && touchStartX.current < 280 && diffX < -50) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [usuario]); // Solo depende de usuario, no de menuOpen

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

        {usuario ? (
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
                <Link to="/dashboard" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (17).png" alt="Dashboard" className="nav-icon" />
                  Dashboard
                </Link>
                <Link to="/mi-inversion" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE%20(24).png" alt="Mi Inversión" className="nav-icon" />
                  Mi Inversión
                </Link>
                <Link to="/recargas" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (4) (1).png" alt="Deposita" className="nav-icon" />
                  Deposita
                </Link>
                <Link to="/gastos-personales" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE%20(23).png" alt="Gastos Personales" className="nav-icon" />
                  Gestión de Gastos Personales
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

                {/* Cursos Dropdown */}
                <div className="nav-dropdown">
                  <button 
                    className="nav-link dropdown-toggle"
                    onClick={() => setMenuOpen(menuOpen === 'cursos' ? false : 'cursos')}
                  >
                    🎓 Cursos
                  </button>
                  {menuOpen === 'cursos' && (
                    <div className="dropdown-menu">
                      <Link to="/cursos/activos-pasivos" className="dropdown-item" onClick={handleMenuClose}>
                        Activos y Pasivos
                      </Link>
                      <Link to="/cursos/economia-emergente" className="dropdown-item" onClick={handleMenuClose}>
                        Economía Emergente
                      </Link>
                      <Link to="/cursos/beneficios-ahorro" className="dropdown-item" onClick={handleMenuClose}>
                        Beneficios del Ahorro
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link to="/prestamos" className="nav-link nav-link-with-img" onClick={handleMenuClose}>
                  <img src="/imagen/BE (15).png" alt="Préstamos" className="nav-icon" />
                  Préstamos
                </Link>
                
                {(usuario.rol === 'admin' || usuario.rol === 'admin_lite') && (
                  <Link to="/admin" className="nav-link admin-link" onClick={handleMenuClose}>⚙️ Panel de Control</Link>
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
