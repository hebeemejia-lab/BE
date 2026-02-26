import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardInversionContainer = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-inversion-container" style={{marginTop: 32, padding: 24, background: '#f8fafc', borderRadius: 16, boxShadow: '0 2px 8px #e2e8f0'}}>
      <h2>Fondo de Riesgo</h2>
      <p>Consulta y analiza tu inversión en el fondo de riesgo.</p>
      <button className="btn-inversion" onClick={() => navigate('/mi-inversion')}>
        Ver Análisis de Mi Inversión
      </button>
    </div>
  );
};

export default DashboardInversionContainer;
