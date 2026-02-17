import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../services/api';

const BuscadorUsuarios = ({ onSelectUsuario }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtrados, setFiltrados] = useState([]);

  useEffect(() => {
    API.get('/admin/usuarios')
      .then(res => {
        setUsuarios(res.data.usuarios || []);
        setFiltrados(res.data.usuarios || []);
      })
      .catch(() => setUsuarios([]));
  }, []);

  useEffect(() => {
    setFiltrados(
      usuarios.filter(u =>
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.cedula && u.cedula.toLowerCase().includes(busqueda.toLowerCase()))
      )
    );
  }, [busqueda, usuarios]);

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar usuario por nombre, email o cédula"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <ul style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee' }}>
        {filtrados.map(usuario => (
          <li key={usuario.id} style={{ padding: 8, cursor: 'pointer' }}
              onClick={() => onSelectUsuario(usuario)}>
            <b>{usuario.nombre} {usuario.apellido}</b> - {usuario.email} <span style={{ color: '#888' }}>({usuario.cedula})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BuscadorUsuarios;
