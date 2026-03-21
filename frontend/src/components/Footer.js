import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">BE</span>
          <p className="footer-tagline">
            Banco Exclusivo — Servicios financieros digitales seguros y confiables.
          </p>
          <p className="footer-disclaimer">
            Banco Exclusivo no es una institución bancaria regulada por entidades gubernamentales.
            Todos los servicios son digitales y operan bajo nuestros términos.
          </p>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <Link to="/politica-privacidad">Política de Privacidad</Link>
          <Link to="/politica-privacidad#terminos">Términos de Uso</Link>
          <Link to="/politica-privacidad#cookies">Política de Cookies</Link>
          <Link to="/politica-privacidad#pagos">Política de Pagos</Link>
        </div>

        <div className="footer-col">
          <h4>Plataforma</h4>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/recargas">Recargar Saldo</Link>
          <Link to="/trading">Trading</Link>
          <Link to="/prestamos">Préstamos</Link>
          <Link to="/cursos">Cursos</Link>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <a href="mailto:soporte@bancoexclusivo.com">soporte@bancoexclusivo.com</a>
          <a href="mailto:admin@bancoexclusivo.lat">admin@bancoexclusivo.lat</a>
          <span className="footer-hours">Lun–Vie 9:00 – 18:00 (ET)</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Banco Exclusivo. Todos los derechos reservados.</span>
        <span>
          <Link to="/politica-privacidad">Políticas actualizadas: marzo 2026</Link>
        </span>
      </div>
    </footer>
  );
}
