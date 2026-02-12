import React from 'react';

export default function Cursos() {
  return (
    <div className="cursos-page">
      <h1>Cursos</h1>
      <ul>
        <li><a href="/cursos/activos-pasivos">Activos y Pasivos</a></li>
        <li><a href="/cursos/economia-emergente">Economía Emergente</a></li>
        <li><a href="/cursos/beneficios-ahorro">Beneficios del Ahorro</a></li>
      </ul>
    </div>
  );
}
