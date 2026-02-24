import React from 'react';

const BudgetAlerts = ({ alerts }) => {
  return (
    <div>
      <h4>Alertas de Presupuesto</h4>
      {alerts && alerts.length > 0 ? (
        <ul>
          {alerts.map((alert, idx) => (
            <li key={idx} style={{ color: 'red' }}>{alert}</li>
          ))}
        </ul>
      ) : (
        <p>No hay alertas.</p>
      )}
    </div>
  );
};

export default BudgetAlerts;
