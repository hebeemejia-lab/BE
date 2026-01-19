import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white', fontSize: '18px' }}>Cargando...</div>;
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
