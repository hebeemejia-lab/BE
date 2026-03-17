import React, { useState, useEffect } from 'react';
import { loanAPI } from '../services/api';
import './Prestamos.css';

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);


  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = async () => {
    try {
      const response = await loanAPI.obtenerMios();
      setPrestamos(response.data);
    } catch (error) {
      console.error('Error cargando préstamos:', error);
    }
  };


  return (
    <div className="prestamos-container">
      {/* Sección de solicitud de préstamo eliminada */}
      <div className="loan-info-card">
        <div className="info-section">
          <h3>Ventajas</h3>
          <ul>
            <li>✓ Aprobación en 24 horas</li>
            <li>✓ Tasas desde 5% anual</li>
            <li>✓ Plazo flexible de 6 a 60 meses</li>
            <li>✓ Sin requisitos adicionales</li>
            <li>✓ Desembolso inmediato</li>
          </ul>
        </div>
        {prestamos.length > 0 && (
          <div className="info-section">
            <h3>Mis Solicitudes</h3>
            <div className="loan-list-small">
              {prestamos.slice(0, 3).map((loan) => (
                <div key={loan._id} className={`loan-badge ${loan.estado}`}>
                  <span className="badge-amount">${loan.montoSolicitado}</span>
                  <span className="badge-status">{loan.estado}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {prestamos.length > 0 && (
        <section className="all-loans-section">
          <h2>Historial de Solicitudes</h2>
          <div className="loan-table">
            <div className="table-header">
              <div className="col">Monto</div>
              <div className="col">Plazo</div>
              <div className="col">Tasa</div>
              <div className="col">Estado</div>
              <div className="col">Fecha</div>
            </div>
            {prestamos.map((loan) => (
              <div key={loan._id} className={`table-row ${loan.estado}`}>
                <div className="col">${Number(loan.montoSolicitado).toFixed(2)}</div>
                <div className="col">{loan.plazo} meses</div>
                <div className="col">{loan.tasaInteres}%</div>
                <div className="col">
                  <span className={`status-badge ${loan.estado}`}>{loan.estado}</span>
                </div>
                <div className="col">
                  {new Date(loan.fechaSolicitud).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}



