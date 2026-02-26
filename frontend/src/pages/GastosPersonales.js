import React, { useEffect, useState, Suspense } from 'react';
import { gastosAPI } from '../services/api';
import AddExpenseForm from './AddExpenseForm.jsx';

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
        ResponsiveContainer: recharts.ResponsiveContainer,
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


  const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } = rechartsComponents;

  return (
    <div className="gastos-personales-panel" style={{padding: '32px'}}>
      <h2>Gestión de Gastos Personales</h2>
      <AddExpenseForm onSubmit={handleAdd} />
      <div style={{marginTop: 24}}>
        <label>Tipo de gráfico: </label>
        <select value={tipoGrafico} onChange={e => setTipoGrafico(e.target.value)}>
          <option value="line">Línea</option>
          <option value="bar">Barras</option>
          <option value="pie">Pastel</option>
        </select>
      </div>
      <div style={{marginTop: 24}}>
        <h3>Recomendaciones</h3>
        {datosVacios ? (
          <div style={{color:'#888'}}>Agrega tus gastos para recibir recomendaciones.</div>
        ) : (
          <ul>
            <li>Revisa tus gastos en categorías altas y ajusta tu presupuesto.</li>
            <li>Intenta reducir gastos en categorías que superan el límite mensual.</li>
            <li>Registra ingresos para visualizar tu balance real.</li>
          </ul>
        )}
      </div>
      <div style={{marginTop: 32}}>
        {tipoGrafico === 'line' && (
          <Suspense fallback={<div>📊</div>}>
            <LineChart data={datosVacios ? [{fecha:'',monto:0}] : dataLine} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="monto" stroke={datosVacios ? '#bbb' : '#1976d2'} name="Monto" />
            </LineChart>
          </Suspense>
        )}
        {tipoGrafico === 'bar' && (
          <Suspense fallback={<div>📊</div>}>
            <BarChart data={datosVacios ? [{categoria:'',monto:0}] : dataBar} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="monto" fill={datosVacios ? '#bbb' : '#43a047'} name="Monto" />
            </BarChart>
          </Suspense>
        )}
        {tipoGrafico === 'pie' && (
          <Suspense fallback={<div>📊</div>}>
            <PieChart>
              <Pie data={datosVacios ? [{categoria:'',monto:0}] : dataPie} dataKey="monto" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} label>
                {(datosVacios ? [{categoria:'',monto:0}] : dataPie).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={datosVacios ? '#bbb' : COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default GastosPersonales;
