import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Retiros
export const retiroAPI = {
  procesar: (datos) => API.post('/retiros/procesar', datos),
  obtenerHistorial: () => API.get('/retiros/historial'),
};

// Interceptor para agregar token a las requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (datos) => API.post('/auth/register', datos),
  login: (datos) => API.post('/auth/login', datos),
  getPerfil: () => API.get('/auth/perfil'),
  verifyEmail: (token) => API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => API.post('/auth/resend-verification', { email }),
};

// Transfers
export const transferAPI = {
  realizar: (datos) => API.post('/transferencias/realizar', datos),
  transferenciaBancaria: (datos) => API.post('/transferencias/bancaria', datos),
  obtenerHistorial: () => API.get('/transferencias/historial'),
  obtenerEnviadas: () => API.get('/transferencias/enviadas'),
  obtenerRecibidas: () => API.get('/transferencias/recibidas'),
};

// Loans
export const loanAPI = {
  solicitar: (datos) => API.post('/prestamos/solicitar', datos),
  obtenerMios: () => API.get('/prestamos/mis-prestamos'),
  obtenerTodos: () => API.get('/prestamos/todos'),
  aprobar: (datos) => API.post('/prestamos/aprobar', datos),
  rechazar: (datos) => API.post('/prestamos/rechazar', datos),
};

// Recargas
export const recargaAPI = {
  crearRecargaStripe: (datos) => API.post('/recargas/crear', datos),
  procesarRecargaTarjeta: (datos) => API.post('/recargas/procesar-tarjeta', datos),
  procesarRecargaExitosa: (datos) => API.post('/recargas/procesar', datos),
  obtenerRecargas: () => API.get('/recargas/historial'),
  obtenerResumenPayPal: () => API.get('/recargas/resumen-paypal'),
  canjearcoCodigo: (datos) => API.post('/recargas/canjear-codigo', datos),
  generarCodigos: (datos) => API.post('/recargas/generar-codigos', datos),
};

// Cuentas Bancarias
export const bankAccountAPI = {
  vincularCuenta: (datos) => API.post('/cuentas-bancarias/vincular', datos),
  verificarCuenta: (datos) => API.post('/cuentas-bancarias/verificar', datos),
  listarCuentas: () => API.get('/cuentas-bancarias/listado'),
  obtenerDefault: () => API.get('/cuentas-bancarias/default'),
  establecerDefault: (datos) => API.post('/cuentas-bancarias/default', datos),
  desvincularCuenta: (cuentaId) => API.post('/cuentas-bancarias/desvincular', { cuentaId }),
  recargarDesdeBanco: (datos) => API.post('/cuentas-bancarias/recargar', datos),
};

export default API;
