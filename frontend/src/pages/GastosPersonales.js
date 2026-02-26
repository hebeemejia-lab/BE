import React, { useEffect, useState } from 'react';
import { gastosAPI } from '../services/api';
import AddExpenseForm from './AddExpenseForm.jsx';
import './GastosPersonales.css';

const COLORS = ['#1976d2', '#43a047', '#fbc02d', '#e53935', '#8e24aa', '#00bcd4', '#ff9800'];

const GastosPersonales = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState({});
  const [tipoGrafico, setTipoGrafico] = useState('line');
  const [rechartsComponents, setRechartsComponents] = useState(null);

  useEffect(() => {
    gastosAPI.obtenerTransacciones().then(res => setTransacciones(res.data || []));
    gastosAPI.obtenerReportes({}).then(res => setResumen(res.data.summary || {}));
  }, []);

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

  const handleAdd = async (data) => {
    await gastosAPI.registrarTransaccion(data);
    gastosAPI.obtenerTransacciones().then(res => setTransacciones(res.data || []));
    gastosAPI.obtenerReportes({}).then(res => setResumen(res.data.summary || {}));
  };

  // Preparar datos para gráficos
  const dataLine = transacciones.map(t => ({
    fecha: t.date,
    monto: t.amount,
    categoria: t.category,
    tipo: t.type
  }));
  const dataBar = Object.entries(resumen).map(([cat, monto], idx) => ({ categoria: cat, monto }));
  const dataPie = dataBar;
  const datosVacios = transacciones.length === 0;

  if (!rechartsComponents) {
    return (
      <div className="gastos-personales-panel">
        <h2>Gestión de Gastos Personales</h2>
        <AddExpenseForm onSubmit={handleAdd} />
        <div className="chart-container">
          <div className="chart-loading">📊</div>
        </div>
      </div>
    );
  }

  const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } = rechartsComponents;

  return (
    <div className="gastos-personales-panel">
      <h2>💰 Gestión de Gastos Personales</h2>
      <AddExpenseForm onSubmit={handleAdd} />
      
      <div className="chart-controls">
        <label>Tipo de gráfico:</label>
        <select value={tipoGrafico} onChange={e => setTipoGrafico(e.target.value)}>
          <option value="line">📈 Línea</option>
          <option value="bar">📊 Barras</option>
          <option value="pie">🥧 Pastel</option>
        </select>
      </div>

      <div className="recommendations">
        <h3>💡 Recomendaciones</h3>
        {datosVacios ? (
          <div className="empty-message">Agrega tus gastos para recibir recomendaciones personalizadas.</div>
        ) : (
          <ul>
            <li>Revisa tus gastos en categorías altas y ajusta tu presupuesto</li>
            <li>Intenta reducir gastos en categorías que superan el límite mensual</li>
            <li>Registra ingresos para visualizar tu balance real</li>
          </ul>
        )}
      </div>

      <div className="chart-container">
        {tipoGrafico === 'line' && (
          <LineChart width={800} height={400} data={datosVacios ? [{fecha:'Sin datos',monto:0}] : dataLine} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="monto" stroke={datosVacios ? '#bbb' : '#1976d2'} name="Monto" strokeWidth={2} />
          </LineChart>
        )}
        {tipoGrafico === 'bar' && (
          <BarChart width={800} height={400} data={datosVacios ? [{categoria:'Sin datos',monto:0}] : dataBar} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="monto" fill={datosVacios ? '#bbb' : '#43a047'} name="Monto" />
          </BarChart>
        )}
        {tipoGrafico === 'pie' && (
          <PieChart width={800} height={400}>
            <Pie data={datosVacios ? [{categoria:'Sin datos',monto:100}] : dataPie} dataKey="monto" nameKey="categoria" cx="50%" cy="50%" outerRadius={120} label>
              {(datosVacios ? [{categoria:'Sin datos',monto:100}] : dataPie).map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={datosVacios ? '#bbb' : COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>

      <div className="transactions-table">
        <h3>📋 Historial de Transacciones</h3>
        {transacciones.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((t, idx) => (
                <tr key={idx}>
                  <td>{t.date}</td>
                  <td>{t.category}</td>
                  <td>
                    <span className={t.type === 'income' ? 'badge-income' : 'badge-expense'}>
                      {t.type === 'income' ? '💵 Ingreso' : '💸 Gasto'}
                    </span>
                  </td>
                  <td>${t.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{textAlign: 'center', color: '#888', padding: '20px 0'}}>No hay transacciones registradas</p>
        )}
      </div>
    </div>
  );
};

export default GastosPersonales;
