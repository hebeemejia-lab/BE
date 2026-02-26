import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './MiInversion.css';

const MiInversion = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  
  const [rechartsComponents, setRechartsComponents] = useState(null);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tipoGrafico, setTipoGrafico] = useState('line');
  const [rangoTiempo, setRangoTiempo] = useState('monthly');

  // Cargar Recharts dinámicamente
  useEffect(() => {
    (async () => {
      try {
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
      } catch (err) {
        console.error('Error cargando Recharts:', err);
        setError('Error cargando gráficos');
      }
    })();
  }, []);

  // Cargar datos de inversiones
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?.id) return;
      
      try {
        setCargando(true);
        const response = await axios.get(`/fondo-riesgo/analysis/${usuario.id}`);
        
        if (response.data && Array.isArray(response.data)) {
          setDatos(response.data);
          setError(null);
        } else {
          setDatos([]);
        }
      } catch (err) {
        console.error('Error cargando inversiones:', err);
        setError('No se pudieron cargar los datos de inversiones');
        setDatos([]);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [usuario?.id]);

  if (!rechartsComponents || !usuario) {
    return <div className="mi-inversion-container loading">Cargando...</div>;
  }

  const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } = rechartsComponents;

  if (cargando) {
    return <div className="mi-inversion-container loading">Cargando inversiones...</div>;
  }

  if (error) {
    return (
      <div className="mi-inversion-container error">
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-volver">
          ← Volver al Dashboard
        </button>
      </div>
    );
  }

  if (!datos || datos.length === 0) {
    return (
      <div className="mi-inversion-container empty">
        <h1>📈 Mi Inversión</h1>
        <p>No tienes inversiones registradas aún</p>
        <button onClick={() => navigate('/dashboard')} className="btn-volver">
          ← Volver al Dashboard
        </button>
      </div>
    );
  }

  // Calcular totales
  const totalInvertido = datos.reduce((sum, d) => sum + (d.monto || 0), 0);
  const totalGanancia = datos.reduce((sum, d) => sum + (d.crecimiento || 0), 0);
  const gananciaPromedio = datos.length > 0 ? (totalGanancia / datos.length).toFixed(2) : 0;

  // Colores para gráfico de pie
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="mi-inversion-container">
      <div className="inversion-header">
        <h1>📈 Mi Inversión</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-volver">
          ← Volver
        </button>
      </div>

      {/* Resumen de inversiones */}
      <div className="inversion-resumen">
        <div className="resumen-card">
          <h3>Total Invertido</h3>
          <p className="monto">${totalInvertido.toLocaleString()}</p>
        </div>
        <div className="resumen-card">
          <h3>Ganancia Total</h3>
          <p className="monto ganancia">${totalGanancia.toLocaleString()}</p>
        </div>
        <div className="resumen-card">
          <h3>Ganancia Promedio</h3>
          <p className="monto">{gananciaPromedio}%</p>
        </div>
      </div>

      {/* Controles */}
      <div className="inversion-controles">
        <div className="control-grupo">
          <label>Tipo de Gráfico:</label>
          <select value={tipoGrafico} onChange={e => setTipoGrafico(e.target.value)}>
            <option value="line">Línea</option>
            <option value="bar">Barras</option>
            <option value="pie">Pastel</option>
          </select>
        </div>

        <div className="control-grupo">
          <label>Rango de Tiempo:</label>
          <select value={rangoTiempo} onChange={e => setRangoTiempo(e.target.value)}>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      </div>

      {/* Gráfico */}
      <div className="inversion-grafico">
        {tipoGrafico === 'line' && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fechaRegistro" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="monto" 
                stroke="#0088FE" 
                name="Monto Invertido"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="crecimiento" 
                stroke="#00C49F" 
                name="Crecimiento"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {tipoGrafico === 'bar' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fechaRegistro" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="monto" fill="#0088FE" name="Monto Invertido" />
              <Bar dataKey="crecimiento" fill="#00C49F" name="Crecimiento" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {tipoGrafico === 'pie' && (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={datos}
                dataKey="monto"
                nameKey="fechaRegistro"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {datos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla de inversiones */}
      <div className="inversion-tabla">
        <h2>Detalle de Inversiones</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto Invertido</th>
              <th>Crecimiento %</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((inversion, idx) => (
              <tr key={idx}>
                <td>{inversion.fechaRegistro || 'N/A'}</td>
                <td className="monto">${(inversion.monto || 0).toLocaleString()}</td>
                <td className="ganancia">{(inversion.crecimiento || 0).toFixed(2)}%</td>
                <td>
                  <span className={`estado ${(inversion.crecimiento || 0) >= 0 ? 'activo' : 'decreciendo'}`}>
                    {(inversion.crecimiento || 0) >= 0 ? '✅ Activo' : '⚠️ Decreciendo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recomendaciones */}
      <div className="inversion-recomendaciones">
        <h2>💡 Recomendaciones</h2>
        <ul>
          {totalGanancia > 0 && (
            <li>✅ Tu inversión está generando ganancias positivas. Considera mantener tu estrategia.</li>
          )}
          {datos.length < 5 && (
            <li>🎯 Diversifica tu portafolio con más inversiones para reducir riesgos.</li>
          )}
          {gananciaPromedio < 2 && (
            <li>📊 La ganancia promedio es baja. Responsable de tu inversión puede ayudarte a optimizar.</li>
          )}
          <li>🔄 Revisa regularmente el desempeño de tus inversiones.</li>
        </ul>
      </div>
    </div>
  );
};

export default MiInversion;