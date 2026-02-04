import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizarUsuario = (data) => {
    if (!data) {
      return data;
    }
    const saldoNormalizado = Number(data.saldo);
    return {
      ...data,
      saldo: Number.isFinite(saldoNormalizado) ? saldoNormalizado : 0,
      moneda: data.moneda || 'USD',
    };
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      if (token) {
        try {
          const response = await authAPI.getPerfil();
          setUsuario(normalizarUsuario(response.data));
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    cargarUsuario();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUsuario(normalizarUsuario(usuario));
      return response.data;
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error en el login';
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (datos) => {
    setLoading(true);
    setError(null);
    try {
      // Enviar nombre y apellido por separado
      const response = await authAPI.register({
        ...datos,
        nombre: datos.nombre,
        apellido: datos.apellido
      });
      const { token, usuario } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        setToken(token);
        setUsuario(normalizarUsuario(usuario));
      }
      return response.data;
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error en el registro';
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refrescarPerfil = async () => {
    if (token) {
      try {
        const response = await authAPI.getPerfil();
        setUsuario(normalizarUsuario(response.data));
        return response.data;
      } catch (err) {
        console.error('Error refrescando perfil:', err);
        throw err;
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, error, login, register, logout, refrescarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
};
