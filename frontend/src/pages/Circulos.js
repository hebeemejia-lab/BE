import React from 'react';

export default function Circulos() {
  return (
    <div className="circulos-view" style={{maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001'}}>
      <h1 style={{fontSize: 28, marginBottom: 12}}>👥 Tu grupo de ahorro</h1>
      <p style={{fontSize: 17, color: '#333'}}>Aquí podrás crear o unirte a un grupo de ahorro comunitario, ver el progreso de los aportes y turnos, y acceder a recursos de educación financiera.</p>
      <ul style={{margin: '18px 0 24px 18px', color: '#555'}}>
        <li>Crear grupo de ahorro</li>
        <li>Unirse a un grupo existente</li>
        <li>Visualizar aportes y turnos</li>
        <li>Panel de transparencia y gamificación</li>
        <li>Educación financiera</li>
      </ul>
      <div style={{marginTop: 32, color: '#b21d2b'}}>
        Si tienes sugerencias para esta sección, ¡compártelas con el equipo!
      </div>
    </div>
  );
}
