import React, { useState, useEffect } from 'react';
// ...existing code...
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

const tabs = [
  { key: 'crear', label: 'Crear grupo' },
  { key: 'unirse', label: 'Unirse a grupo' },
  { key: 'mi-grupo', label: 'Mi grupo' },
  { key: 'transparencia', label: 'Transparencia / Gamificación' },
  { key: 'educacion', label: 'Educación financiera' },
];

export default function TuGrupo() {
  const [tab, setTab] = useState('crear');
  const [form, setForm] = useState({ nombre: '', monto: '', frecuencia: '', miembrosMax: '' });
  const [grupos, setGrupos] = useState([]);
  const [miGrupo, setMiGrupo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar grupos disponibles
  useEffect(() => {
    if (tab === 'unirse') {
      axios.get(`${API}/circulos`)
        .then(res => setGrupos(res.data.circulos || []))
        .catch(() => setGrupos([]));
    }
    if (tab === 'mi-grupo') {
      axios.get(`${API}/circulos/mios`)
        .then(res => setMiGrupo(res.data.circulo || null))
        .catch(() => setMiGrupo(null));
    }
  }, [tab]);

  // Crear grupo
  const handleCrear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API}/circulos`,
        form,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setMensaje('Grupo creado con éxito');
      setForm({ nombre: '', monto: '', frecuencia: '', miembrosMax: '' });
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || 'Error al crear grupo');
    } finally {
      setLoading(false);
    }
  };

  // Unirse a grupo
  const handleUnirse = async (id) => {
    setLoading(true);
    setMensaje('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/circulos/${id}/join`,
        {},
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setMensaje('Te uniste al grupo');
      setTab('mi-grupo');
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || 'Error al unirse');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de tabs
  return (
    <div style={{maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: 24}}>
      <h1 style={{fontSize: 28, marginBottom: 12}}>👥 Tu grupo de ahorro</h1>
      <div style={{display: 'flex', gap: 8, marginBottom: 24}}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: tab === t.key ? '#1976d2' : '#f1f5f9',
              color: tab === t.key ? '#fff' : '#222',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: tab === t.key ? '0 2px 8px #1976d233' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {mensaje && <div style={{marginBottom: 16, color: mensaje.includes('éxito') ? '#1976d2' : '#b21d2b'}}>{mensaje}</div>}
      {tab === 'crear' && (
        <form onSubmit={handleCrear} style={{maxWidth: 400}}>
          <label>Nombre del grupo
            <input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} required style={{width: '100%', marginBottom: 12}} />
          </label>
          <label>Monto de aporte
            <input type="number" value={form.monto} onChange={e => setForm(f => ({...f, monto: e.target.value}))} required style={{width: '100%', marginBottom: 12}} />
          </label>
          <label>Frecuencia
            <input type="text" value={form.frecuencia} onChange={e => setForm(f => ({...f, frecuencia: e.target.value}))} required style={{width: '100%', marginBottom: 12}} />
          </label>
          <label>Número de miembros
            <input type="number" value={form.miembrosMax} onChange={e => setForm(f => ({...f, miembrosMax: e.target.value}))} required style={{width: '100%', marginBottom: 12}} />
          </label>
          <button type="submit" disabled={loading} style={{background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600}}>
            {loading ? 'Creando...' : 'Crear grupo'}
          </button>
        </form>
      )}
      {tab === 'unirse' && (
        <div>
          <h3>Grupos disponibles</h3>
          {grupos.length === 0 ? <p>No hay grupos disponibles.</p> : (
            <ul style={{paddingLeft: 18}}>
              {grupos.map(g => (
                <li key={g.id} style={{marginBottom: 10}}>
                  <b>{g.nombre}</b> - Aporte: ${g.montoAporte} - Miembros: {g.miembrosMax}
                  <button onClick={() => handleUnirse(g.id)} style={{marginLeft: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontWeight: 600}}>
                    Unirse
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === 'mi-grupo' && (
        <div>
          <h3>Mi grupo</h3>
          {!miGrupo ? <p>No perteneces a ningún grupo.</p> : (
            <div style={{marginBottom: 18}}>
              <b>{miGrupo.nombre}</b> <br/>
              Aporte: ${miGrupo.montoAporte} <br/>
              Miembros: {miGrupo.miembrosMax} <br/>
              Estado: {miGrupo.estado}
              {/* Aquí puedes agregar visualización de aportes, turnos y progreso */}
            </div>
          )}
        </div>
      )}
      {tab === 'transparencia' && (
        <div>
          <h3>Transparencia y Gamificación</h3>
          <p>Próximamente: historial de aportes, insignias y estadísticas del grupo.</p>
        </div>
      )}
      {tab === 'educacion' && (
        <div>
          <h3>Educación financiera</h3>
          <ul>
            <li><a href="https://www.bbva.com/es/finanzas-personales/ahorro/" target="_blank" rel="noopener noreferrer">Artículos de ahorro</a></li>
            <li><a href="https://www.bancomundial.org/es/topic/financialinclusion" target="_blank" rel="noopener noreferrer">Inclusión financiera</a></li>
            <li><a href="https://www.bancoexclusivo.lat/ahorro" target="_blank" rel="noopener noreferrer">Simulador de ahorro</a></li>
          </ul>
        </div>
      )}
    </div>
  );
}
