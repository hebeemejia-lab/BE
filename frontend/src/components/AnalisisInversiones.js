import React, { useState, useEffect, Suspense } from 'react';
import api from '../services/api';
// ...existing code...

const timeRanges = [
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
];

const AnalisisInversiones = () => {
    const [rechartsComponents, setRechartsComponents] = useState(null);

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

    if (!rechartsComponents) {
      return (
        <div className="analisis-inversiones-panel">
          <h2>Análisis de Inversiones</h2>
          <div>📊</div>
        </div>
      );
    }

    const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } = rechartsComponents;
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [analysisData, setAnalysisData] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [monto, setMonto] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [tipoGrafico, setTipoGrafico] = useState('line');

  useEffect(() => {
    // Obtener lista de clientes
    api.get('/admin/usuarios').then(res => setClientes(res.data || []));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      api.get(`/fondo-riesgo/analysis/${clienteSeleccionado}`).then(res => setAnalysisData(res.data || []));
    }
  }, [clienteSeleccionado, selectedRange]);

  const asignarFondo = async () => {
    await api.post(`/fondo-riesgo/clients/${clienteSeleccionado}/funds`, {
      monto,
      porcentaje,
      fechaRegistro,
    });
    api.get(`/fondo-riesgo/analysis/${clienteSeleccionado}`).then(res => setAnalysisData(res.data || []));
  };

  return (
    <div className="analisis-inversiones-panel">
      <h2>Análisis de Inversiones</h2>
      <div>
        <label>Rango de tiempo: </label>
        <select value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
          {timeRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
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
        {analysisData.length === 0 ? (
          <div style={{color:'#888'}}>Agrega una inversión para recibir recomendaciones.</div>
        ) : (
          <ul>
            <li>Revisa el crecimiento de la inversión de cada cliente.</li>
            <li>Identifica clientes con bajo rendimiento y sugiere ajustes de porcentaje.</li>
            <li>Promueve diversificación para clientes con crecimiento bajo.</li>
          </ul>
        )}
      </div>
      <div style={{marginTop: 32}}>
        {tipoGrafico === 'line' && (
          <LineChart data={analysisData.length === 0 ? [{fechaRegistro:'',monto:0,crecimiento:0}] : analysisData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fechaRegistro" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="monto" stroke={analysisData.length === 0 ? '#bbb' : '#1976d2'} name="Monto" />
            <Line type="monotone" dataKey="crecimiento" stroke={analysisData.length === 0 ? '#bbb' : '#43a047'} name="Crecimiento" />
          </LineChart>
        )}
        {tipoGrafico === 'bar' && (
          <BarChart data={analysisData.length === 0 ? [{fechaRegistro:'',monto:0,crecimiento:0}] : analysisData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
          <PieChart>
            <Pie data={analysisData.length === 0 ? [{fechaRegistro:'',monto:0}] : analysisData} dataKey="monto" nameKey="fechaRegistro" cx="50%" cy="50%" outerRadius={80} label>
              {(analysisData.length === 0 ? [{fechaRegistro:'',monto:0}] : analysisData).map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={analysisData.length === 0 ? '#bbb' : ['#1976d2','#43a047','#fbc02d','#e53935','#8e24aa','#00bcd4','#ff9800'][idx % 7]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>
      <div>
        <h3>Montos invertidos por cliente</h3>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Porcentaje</th>
              <th>Fecha Registro</th>
              <th>Crecimiento</th>
            </tr>
          </thead>
          <tbody>
            {analysisData.map((f, idx) => (
              <tr key={idx}>
                <td>{f.usuarioId}</td>
                <td>{f.monto}</td>
                <td>{f.porcentaje}</td>
                <td>{f.fechaRegistro}</td>
                <td>{f.crecimiento || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalisisInversiones;
