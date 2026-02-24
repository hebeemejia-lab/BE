import React, { useEffect } from 'react';
import Chart from 'chart.js/auto';

const Dashboard = () => {
  // Simulación de datos
  const data = {
    summary: {
      Alimentación: 300,
      Transporte: 150,
      Entretenimiento: 100,
      Salud: 80,
      Otros: 70
    }
  };

  useEffect(() => {
    const ctx = document.getElementById('expensesChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data.summary),
          datasets: [{
            data: Object.values(data.summary),
            backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'],
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Distribución de Gastos por Categoría' },
          },
        },
      });
    }
  }, []);

  return (
    <div>
      <h2>Resumen de Gastos e Ingresos</h2>
      <canvas id="expensesChart" style={{ maxWidth: 400 }}></canvas>
    </div>
  );
};

export default Dashboard;
