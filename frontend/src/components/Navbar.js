import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-header">
          <Link to="/" className="navbar-logo" onClick={handleMenuClose}>
            <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" className="logo-img" />
            <span className="logo-text">Banco Exclusivo</span>
          </Link>

          {usuario && (
            <button 
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span></span>
              <span></span>
              <span></span>
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
                <Link to="/dashboard" className="nav-link" onClick={handleMenuClose}>📊 Dashboard</Link>
                <Link to="/recargas" className="nav-link" onClick={handleMenuClose}>💳 Recargas</Link>
                <Link to="/retiros" className="nav-link" onClick={handleMenuClose}>💸 Retiros</Link>
                <Link to="/vincular-cuenta" className="nav-link" onClick={handleMenuClose}>🏧 Vincular Cuenta</Link>
                <Link to="/transferencias" className="nav-link" onClick={handleMenuClose}>🔄 Transferencias</Link>
                <Link to="/transferencias-bancarias" className="nav-link" onClick={handleMenuClose}>🏦 Transf. Bancaria</Link>
                <Link to="/transferencias-internacionales" className="nav-link" onClick={handleMenuClose}>🌍 Transf. Internacional</Link>
                <Link to="/prestamos" className="nav-link" onClick={handleMenuClose}>📈 Préstamos</Link>
                
                {usuario.rol === 'admin' && (
                  <Link to="/admin" className="nav-link admin-link" onClick={handleMenuClose}>⚙️ Admin</Link>
                )}
                
                <Link to="/perfil" className="nav-link" onClick={handleMenuClose}>👤 Perfil</Link>
                
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
          </div>
        )}
      </div>
    </nav>
  );
}
