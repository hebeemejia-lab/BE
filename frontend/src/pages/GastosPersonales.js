import React, { useEffect, useState, Suspense } from 'react';
import { gastosAPI } from '../services/api';
import AddExpenseForm from './AddExpenseForm.jsx';
import Recharts from 'recharts';

const COLORS = ['#1976d2', '#43a047', '#fbc02d', '#e53935', '#8e24aa', '#00bcd4', '#ff9800'];

const GastosPersonales = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState({});
  const [tipoGrafico, setTipoGrafico] = useState('line');

  useEffect(() => {
    gastosAPI.obtenerTransacciones().then(res => setTransacciones(res.data || []));
    gastosAPI.obtenerReportes({}).then(res => setResumen(res.data.summary || {}));
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
          <Suspense fallback={<div>Cargando...</div>}>
            <Recharts.LineChart data={datosVacios ? [{fecha:'',monto:0}] : dataLine} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="monto" stroke={datosVacios ? '#bbb' : '#1976d2'} name="Monto" />
            </Recharts.LineChart>
          </Suspense>
        )}
        {tipoGrafico === 'bar' && (
          <Suspense fallback={<div>Cargando...</div>}>
            <Recharts.BarChart data={datosVacios ? [{categoria:'',monto:0}] : dataBar} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="monto" fill={datosVacios ? '#bbb' : '#43a047'} name="Monto" />
            </Recharts.BarChart>
          </Suspense>
        )}
        {tipoGrafico === 'pie' && (
          <Suspense fallback={<div>Cargando...</div>}>
            <Recharts.PieChart>
              <Pie data={datosVacios ? [{categoria:'',monto:0}] : dataPie} dataKey="monto" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} label>
                {(datosVacios ? [{categoria:'',monto:0}] : dataPie).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={datosVacios ? '#bbb' : COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </Recharts.PieChart>
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default GastosPersonales;
