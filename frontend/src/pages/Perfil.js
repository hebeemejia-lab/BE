import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

export default function Perfil() {
  const { usuario, updatePerfil } = useContext(AuthContext);
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    email: usuario?.email || '',
  });
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await updatePerfil(form);
      setMensaje('Datos actualizados correctamente');
      setEditando(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error actualizando perfil');
    }
  };

  return (
    <div className="perfil-container">
      <h2>Mi Perfil</h2>
      {mensaje && <div className="success-message">{mensaje}</div>}
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="perfil-form">
        <div className="form-group">
          <label>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} disabled={!editando} />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} disabled={!editando} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} disabled={!editando} />
        </div>
        {editando ? (
          <button type="submit" className="btn-submit">Guardar</button>
        ) : (
          <button type="button" onClick={() => setEditando(true)} className="btn-submit">Editar</button>
        )}
      </form>
    </div>
  );
}
