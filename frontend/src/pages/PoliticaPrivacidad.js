import React from 'react';
import './PoliticaPrivacidad.css';

const PoliticaPrivacidad = () => (
  <div className="policy-page">
    <header className="policy-hero">
      <div className="policy-hero-content">
        <span className="policy-kicker">Banco Exclusivo</span>
        <h1>Politicas de Seguridad y Privacidad</h1>
        <p>
          Tu informacion y tus transacciones estan protegidas con estandares bancarios.
          Aqui explicamos como cuidamos tus datos y tu experiencia.
        </p>
      </div>
      <div className="policy-hero-accent"></div>
    </header>

    <section className="policy-section">
      <h2>1. Seguridad de la Informacion</h2>
      <ul>
        <li>Todos los datos se transmiten con cifrado SSL/TLS.</li>
        <li>Cumplimos con PCI DSS para el manejo de tarjetas.</li>
        <li>No almacenamos CVV ni datos sensibles de tarjetas.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>2. Uso de Datos</h2>
      <ul>
        <li>Usamos tu informacion solo para gestionar tu cuenta y operaciones.</li>
        <li>No compartimos datos con terceros salvo requerimiento legal o proveedores necesarios.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>3. Comisiones y Transacciones</h2>
      <ul>
        <li>En recargas se aplica una comision vigente antes de acreditar el saldo.</li>
        <li>La comision y el monto neto se muestran antes de confirmar.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>4. Sesion y Seguridad</h2>
      <ul>
        <li>Si la sesion expira o el token es invalido, se requiere login nuevamente.</li>
        <li>Recomendamos activar verificacion por email y usar contrasenas seguras.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>5. Derechos del Usuario</h2>
      <ul>
        <li>Puedes solicitar eliminacion de tu cuenta y datos personales.</li>
        <li>Para dudas o solicitudes: soporte@bancoexclusivo.com.</li>
      </ul>
    </section>

    <footer className="policy-footer">
      <span>Ultima actualizacion: 19 de enero de 2026</span>
    </footer>
  </div>
);

export default PoliticaPrivacidad;
