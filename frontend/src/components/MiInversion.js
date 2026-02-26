import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MiInversion.css';

const timeRanges = [
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
];

const COLORS = ['#1976d2', '#43a047', '#fbc02d', '#e53935', '#8e24aa', '#00bcd4', '#ff9800'];

const MiInversion = () => {
  const { usuario } = useContext(AuthContext);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [analysisData, setAnalysisData] = useState([]);
  const [tipoGrafico, setTipoGrafico] = useState('line');
  const [rechartsComponents, setRechartsComponents] = useState(null);

  useEffect(() => {
    if (usuario?.id) {
      api.get(`/fondo-riesgo/analysis/${usuario.id}`).then(res => setAnalysisData(res.data || []));
    }
  }, [usuario, selectedRange]);

  useEffect(() => {
    (async () => {
      const recharts = await import('recharts');
      setRechartsComponents({
        LineChart: recharts.LineChart,
        Line: recharts.Line,
        BarChart: recharts.BarChart,
        Bar: recharts.Bar,
        PieChart: recharts.PieChart,
        Pie: recharts.Pie,
        Cell: recharts.Cell,
        XAxis: recharts.XAxis,
        YAxis: recharts.YAxis,
        Tooltip: recharts.Tooltip,
        CartesianGrid: recharts.CartesianGrid,
        Legend: recharts.Legend
      });
    })();
  }, []);

  // Fallback for chart rendering
  if (!rechartsComponents) {
    return (
      <div className="mi-inversion-panel">
        <h2>💹 Mi Inversión en Fondo de Riesgo</h2>
        <div className="inversion-chart-container">
          <div className="inversion-chart-loading">📊</div>
        </div>
      </div>
    );
  }

  const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } = rechartsComponents;

  return (
    <div className="mi-inversion-panel">
      <h2>💹 Mi Inversión en Fondo de Riesgo</h2>
      
      <div className="inversion-controls">
        <label>Rango de tiempo:</label>
        <select value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
          {timeRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        
        <label>Tipo de gráfico:</label>
        <select value={tipoGrafico} onChange={e => setTipoGrafico(e.target.value)}>
          <option value="line">📈 Línea</option>
          <option value="bar">📊 Barras</option>
          <option value="pie">🥧 Pastel</option>
        </select>
      </div>

      <div className="inversion-recommendations">
        <h3>💡 Recomendaciones</h3>
        {analysisData.length === 0 ? (
          <div className="empty-message">
            Aún no tienes inversiones registradas. Contacta al administrador para asignar una inversión.
          </div>
        ) : (
          <ul>
            <li>Revisa el crecimiento de tu inversión y ajusta el porcentaje si es necesario</li>
            <li>Consulta el historial para identificar periodos de mayor rendimiento</li>
            <li>Considera diversificar si el crecimiento es bajo</li>
          </ul>
        )}
      </div>

      <div className="inversion-chart-container">
        {tipoGrafico === 'line' && (
          <LineChart width={800} height={400} data={analysisData.length === 0 ? [{fechaRegistro:'Sin datos',monto:0,crecimiento:0}] : analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fechaRegistro" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="monto" stroke={analysisData.length === 0 ? '#bbb' : '#1976d2'} name="Monto" strokeWidth={2} />
            <Line type="monotone" dataKey="crecimiento" stroke={analysisData.length === 0 ? '#bbb' : '#43a047'} name="Crecimiento" strokeWidth={2} />
          </LineChart>
        )}
        {tipoGrafico === 'bar' && (
          <BarChart width={800} height={400} data={analysisData.length === 0 ? [{fechaRegistro:'Sin datos',monto:0,crecimiento:0}] : analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fechaRegistro" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="monto" fill={analysisData.length === 0 ? '#bbb' : '#1976d2'} name="Monto" />
            <Bar dataKey="crecimiento" fill={analysisData.length === 0 ? '#bbb' : '#43a047'} name="Crecimiento" />
          </BarChart>
        )}
        {tipoGrafico === 'pie' && (
          <PieChart width={800} height={400}>
            <Pie data={analysisData.length === 0 ? [{fechaRegistro:'Sin datos',monto:100}] : analysisData} dataKey="monto" nameKey="fechaRegistro" cx="50%" cy="50%" outerRadius={120} label>
              {(analysisData.length === 0 ? [{fechaRegistro:'Sin datos',monto:100}] : analysisData).map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={analysisData.length === 0 ? '#bbb' : COLORS[idx % 7]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>

      <div className="inversion-table">
        <h3>📋 Detalle de mi inversión</h3>
        {analysisData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Monto</th>
                <th>Porcentaje</th>
                <th>Fecha Registro</th>
                <th>Fecha Ganancia</th>
                <th>Crecimiento</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.map((f, idx) => (
                <tr key={idx}>
                  <td>${f.monto?.toFixed(2) || '0.00'}</td>
                  <td>{f.porcentaje}%</td>
                  <td>{f.fechaRegistro}</td>
                  <td>{f.fechaGanancia || '-'}</td>
                  <td>${f.crecimiento?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{textAlign: 'center', color: '#888', padding: '20px 0'}}>
            No tienes inversiones registradas
          </p>
        )}
      </div>
    </div>
  );
};

export default MiInversion;
