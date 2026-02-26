import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Bienvenido a Banexclusivo</h1>
          <p className="hero-subtitle">Transferencias y Préstamos Seguros y Rápidos</p>

          {usuario ? (
            <div className="hero-features">
              <button onClick={() => navigate('/transferencias')} className="feature-button transferencias">
                <span className="button-icon">💸</span>
                <span>Realizar Transferencia</span>
              </button>
              <button onClick={() => navigate('/prestamos')} className="feature-button prestamos">
                <span className="button-icon">💰</span>
                <span>Solicitar Préstamo</span>
              </button>
              <button onClick={() => navigate('/dashboard')} className="feature-button dashboard">
                <span className="button-icon">📊</span>
                <span>Mi Dashboard</span>
              </button>
            </div>
          ) : (
            <div className="hero-buttons">
              <button onClick={() => navigate('/login')} className="btn btn-primary">
                Iniciar Sesión
              </button>
              <button onClick={() => navigate('/register')} className="btn btn-secondary">
                Crear Cuenta
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="features-section">
        <h2>¿Por qué elegirnos?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Seguridad Total</h3>
            <p>Encriptación de nivel bancario para proteger tus transacciones</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Rápido y Fácil</h3>
            <p>Transfiere dinero en segundos con nuestra plataforma intuitiva</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h3>Tasas Competitivas</h3>
            <p>Las mejores tasas de interés para tus préstamos</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">24/7</span>
            <h3>Disponible Siempre</h3>
            <p>Accede a tu cuenta cuando quieras, desde cualquier dispositivo</p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <h2>Nuestros Servicios</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>Transferencias Bancarias</h3>
            <p>Realiza transferencias entre cuentas de forma segura y rápida. Sin límites de cantidad ni horarios.</p>
          </div>
          <div className="info-card">
            <h3>Préstamos Personales</h3>
            <p>Solicita un préstamo con tasas justas. Aprobación rápida y opciones de plazo flexible.</p>
          </div>
          <div className="info-card">
            <h3>Historial Completo</h3>
            <p>Accede a tu historial completo de transacciones y préstamos en todo momento.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
