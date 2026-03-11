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
                <a
                  href="https://bancoexclusivo.lat/TuGrupo"
                  className="navbar-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleMenuClose}
                  style={{ marginRight: 18, fontWeight: 600 }}
                >
                  Tu grupo
                </a>
                <div className="user-info">
                  <span className="user-name">
                    {usuario.nombre && usuario.apellido
                      ? `${usuario.nombre} ${usuario.apellido}`
                      : usuario.nombre || usuario.apellido || 'Usuario'}
                  </span>
                  <span className="user-balance">Balance: {formatMoney(usuario?.saldo)}</span>
                </div>
                <div className="navbar-links">
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Dashboard')}
                  >
                    <img src="/imagen/BE (17).png" alt="Dashboard" className="nav-icon" />
                    Dashboard
                  </a>
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/MiInversion')}
                  >
                    <img src="/imagen/BE%20(24).png" alt="Mi Inversión" className="nav-icon" />
                    Mi Inversión
                  </a>
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Deposita')}
                  >
                    <img src="/imagen/BE (4) (1).png" alt="Deposita" className="nav-icon" />
                    Deposita
                  </a>
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/GestionDeGastosPersonales')}
                  >
                    <img src="/imagen/BE%20(23).png" alt="Gastos Personales" className="nav-icon" />
                    Gestión de Gastos Personales
                  </a>
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Retiros')}
                  >
                    <img src="/imagen/BE (5) (1).png" alt="Retiros" className="nav-icon" />
                    Retiros
                  </a>
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/VincularCuenta')}
                  >
                    <img src="/imagen/BE (11).png" alt="Vincular Cuenta" className="nav-icon" />
                    Vincular Cuenta
                  </a>
                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Transacciones')}
                  >
                    <span role="img" aria-label="Transacciones">💸</span>
                    Transacciones
                  </a>
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
                        <a href="https://bancoexclusivo.lat/Transferencias" className="dropdown-item" target="_blank" rel="noopener noreferrer" onClick={handleMenuClose}>
                          <img src="/imagen/BE (6) (1).png" alt="Transferencias" className="nav-icon" />
                          Transferencias
                        </a>
                        <a href="https://bancoexclusivo.lat/TransferenciasBancarias" className="dropdown-item" target="_blank" rel="noopener noreferrer" onClick={handleMenuClose}>
                          <img src="/imagen/BE (14).png" alt="Transf. Bancaria" className="nav-icon" />
                          Transf. Bancaria
                        </a>
                        <a href="https://bancoexclusivo.lat/TransferenciasInternacionales" className="dropdown-item" target="_blank" rel="noopener noreferrer" onClick={handleMenuClose}>
                          <img src="/imagen/Adobe Express - file (12).png" alt="Transf. Internacional" className="nav-icon" />
                          Transf. Internacional
                        </a>
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
                        <a href="#" className="dropdown-item" onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Cursos/ActivosPasivos')}>
                          Activos y Pasivos
                        </a>
                        <a href="#" className="dropdown-item" onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Cursos/EconomiaEmergente')}>
                          Economía Emergente
                        </a>
                        <a href="#" className="dropdown-item" onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Cursos/BeneficiosAhorro')}>
                          Beneficios del Ahorro
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <a
                    href="#"
                    className="nav-link admin-link"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Admin')}
                  >⚙️ Panel de Control</a>

                  {usuario.rol === 'admin' && (
                    <a
                      href="#"
                      className="nav-link admin-link"
                      onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Desarrolladores')}
                    >Desarrolladores</a>
                  )}

                  <a
                    href="#"
                    className="nav-link nav-link-with-img"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/Perfil')}
                  >
                    <img src="/imagen/BE (13).png" alt="Perfil" className="nav-icon" />
                    Perfil
                  </a>

                  <a
                    href="#"
                    className="nav-link"
                    onClick={e => handleExternalNav(e, 'https://bancoexclusivo.lat/PoliticaDePrivacidad')}
                  >
                    🔐 Politicas de Seguridad
                  </a>
                  
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
