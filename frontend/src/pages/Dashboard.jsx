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
      {/* Playlist de Spotify al final del dashboard */}
      <div style={{ marginTop: 40, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <iframe
          data-testid="embed-iframe"
          style={{ borderRadius: 12, minWidth: 300, maxWidth: 600, width: '100%' }}
          src="https://open.spotify.com/embed/playlist/1wTJ4kpTrJsrYG31FV6mys?utm_source=generator"
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default Dashboard;
