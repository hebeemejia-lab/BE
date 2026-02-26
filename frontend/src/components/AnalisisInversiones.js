import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AnalisisInversiones.css';

const timeRanges = [
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
];

const COLORS = ['#1976d2', '#43a047', '#fbc02d', '#e53935', '#8e24aa', '#00bcd4', '#ff9800'];

const AnalisisInversiones = () => {
  const [rechartsComponents, setRechartsComponents] = useState(null);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [analysisData, setAnalysisData] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [monto, setMonto] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [tipoGrafico, setTipoGrafico] = useState('line');
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

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

  useEffect(() => {
    // Obtener lista de clientes
    api.get('/admin/usuarios')
      .then(res => setClientes(res.data?.usuarios || res.data || []))
      .catch(err => console.error('Error cargando clientes:', err));
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      api.get(`/fondo-riesgo/analysis/${clienteSeleccionado}`).then(res => setAnalysisData(res.data || [])).catch(err => console.error('Error cargando análisis:', err));
    } else {
      setAnalysisData([]);
    }
  }, [clienteSeleccionado, selectedRange]);

  const asignarFondo = async (e) => {
    e.preventDefault();
    try {
      if (!clienteSeleccionado || !monto || !porcentaje || !fechaRegistro) {
        setMensaje('Por favor completa todos los campos');
        setTipoMensaje('error');
        return;
      }

      await api.post(`/fondo-riesgo/clients/${clienteSeleccionado}/funds`, {
        monto: parseFloat(monto),
        porcentaje: parseFloat(porcentaje),
        fechaRegistro,
      });

      setMensaje('✅ Inversión asignada exitosamente');
      setTipoMensaje('success');
      setMonto('');
      setPorcentaje('');
      setFechaRegistro('');

      // Recargar datos
      api.get(`/fondo-riesgo/analysis/${clienteSeleccionado}`).then(res => setAnalysisData(res.data || []));

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al asignar inversión: ' + (error.response?.data?.mensaje || error.message));
      setTipoMensaje('error');
    }
  };

  if (!rechartsComponents) {
    return (
      <div className="analisis-inversiones-panel">
        <div className="inversiones-admin-header">
          <h2>💹 Análisis de Inversiones</h2>
        </div>
        <div className="analisis-chart-container">
          <div style={{fontSize: '48px'}}>📊</div>
        </div>
      </div>
    );
  }

  const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } = rechartsComponents;

  return (
    <div className="analisis-inversiones-panel">
      <div className="inversiones-admin-header">
        <h2>💹 Análisis de Inversiones</h2>
        <p>Gestiona y analiza las inversiones de tus clientes</p>
      </div>

      {mensaje && (
        <div className={tipoMensaje === 'success' ? 'alert-success' : 'alert-error'}>
          {mensaje}
        </div>
      )}

      <form className="asignar-inversion-form" onSubmit={asignarFondo}>
        <h3>➕ Asignar Nueva Inversión</h3>
        <div className="form-row">
          <div className="form-field">
            <label>Cliente</label>
            <select value={clienteSeleccionado} onChange={e => setClienteSeleccionado(e.target.value)} required>
              <option value="">Selecciona un cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido} - {cliente.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Monto ($)</label>
            <input
              type="number"
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-field">
            <label>Porcentaje (%)</label>
            <input
              type="number"
              placeholder="0.00"
              value={porcentaje}
              onChange={e => setPorcentaje(e.target.value)}
              step="0.01"
              min="0"
              max="100"
              required
            />
          </div>

          <div className="form-field">
            <label>Fecha de Registro</label>
            <input
              type="date"
              value={fechaRegistro}
              onChange={e => setFechaRegistro(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-asignar">
          ✅ Asignar Inversión
        </button>
      </form>

      <div className="analisis-controls">
        <label>Ver inversiones de:</label>
        <select value={clienteSeleccionado} onChange={e => setClienteSeleccionado(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clientes.map(cliente => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre} {cliente.apellido}
            </option>
          ))}
        </select>

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

      <div className="analisis-chart-container">
        {tipoGrafico === 'line' && (
          <LineChart width={900} height={400} data={analysisData.length === 0 ? [{fechaRegistro:'Sin datos',monto:0,crecimiento:0}] : analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
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
          <BarChart width={900} height={400} data={analysisData.length === 0 ? [{fechaRegistro:'Sin datos',monto:0,crecimiento:0}] : analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
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
          <PieChart width={900} height={400}>
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

      <div className="inversiones-table">
        <h3>📋 Montos invertidos por cliente</h3>
        {analysisData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Cliente ID</th>
                <th>Monto</th>
                <th>Porcentaje</th>
                <th>Fecha Registro</th>
                <th>Crecimiento</th>
                <th>Fecha Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.map((f, idx) => (
                <tr key={idx}>
                  <td>{f.usuarioId || 'Sin cliente'}</td>
                  <td>${parseFloat(f.monto).toFixed(2)}</td>
                  <td>{f.porcentaje}%</td>
                  <td>{f.fechaRegistro}</td>
                  <td>${parseFloat(f.crecimiento || 0).toFixed(2)}</td>
                  <td>{f.fechaGanancia || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{textAlign: 'center', color: '#888', padding: '20px 0'}}>
            {clienteSeleccionado ? 'Este cliente no tiene inversiones registradas' : 'Selecciona un cliente para ver sus inversiones'}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalisisInversiones;
