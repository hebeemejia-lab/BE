import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);
  const { formatMoney } = useContext(CurrencyContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('adminSandboxMode') === 'true');
  const [loadingRedirect, setLoadingRedirect] = useState(false);

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

  const handleExternalNav = (e, url) => {
    e.preventDefault();
    setLoadingRedirect(true);
    setTimeout(() => {
      window.location.href = url;
    }, 400);
  };

  return (
    <>
      {loadingRedirect ? (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff8', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader" style={{ width: 60, height: 60, border: '8px solid #1976d2', borderTop: '8px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
        </div>
      ) : null}

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
                  <Link
                    to="/dashboard"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE (17).png" alt="Dashboard" className="nav-icon" />
                    Dashboard
                  </Link>
                  <Link
                    to="/mi-inversion"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE%20(24).png" alt="Mi Inversión" className="nav-icon" />
                    Mi Inversión
                  </Link>
                  <Link
                    to="/recargas"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE (4) (1).png" alt="Deposita" className="nav-icon" />
                    Deposita
                  </Link>
                  <Link
                    to="/gastos-personales"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE%20(23).png" alt="Gastos Personales" className="nav-icon" />
                    Gestión de Gastos Personales
                  </Link>
                  <Link
                    to="/retiros"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE (5) (1).png" alt="Retiros" className="nav-icon" />
                    Retiros
                  </Link>
                  <Link
                    to="/vincular-cuenta"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE (11).png" alt="Vincular Cuenta" className="nav-icon" />
                    Vincular Cuenta
                  </Link>
                  <Link
                    to="/transferencias"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <span role="img" aria-label="Transacciones">💸</span>
                    Transacciones
                  </Link>
                  {/* Todos los enlaces principales ya están como <a> externos arriba */}
                  
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
                  
                  {usuario.email === 'admin@bancoexclusivo.lat' && (
                    <>
                      <Link
                        to="/admin"
                        className="nav-link admin-link"
                        onClick={handleMenuClose}
                      >⚙️ Panel de Control</Link>
                      {/* El enlace a Desarrolladores se oculta porque no existe la ruta */}
                    </>
                  )}

                  <Link
                    to="/perfil"
                    className="nav-link nav-link-with-img"
                    onClick={handleMenuClose}
                  >
                    <img src="/imagen/BE (13).png" alt="Perfil" className="nav-icon" />
                    Perfil
                  </Link>

                  <Link
                    to="/politica-privacidad"
                    className="nav-link"
                    onClick={handleMenuClose}
                  >
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
    </>
  );
}
