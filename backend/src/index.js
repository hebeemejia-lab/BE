require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB } = require('./config/database');

// Rutas
const authRoutes = require('./routes/authRoutes');
const transferRoutes = require('./routes/transferRoutes');
const loanRoutes = require('./routes/loanRoutes');
const carterCardRoutes = require('./routes/carterCardRoutes');
const recargaRoutes = require('./routes/recargaRoutes');
const retiroRoutes = require('./routes/retiroRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');

const app = express();

// Conectar a SQLite
connectDB();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
];
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) o si está en la lista
    if (!origin || allowedOrigins.some(o => o && origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/transferencias', transferRoutes);
app.use('/api/prestamos', loanRoutes);
app.use('/api/carter-card', carterCardRoutes);
app.use('/api/recargas', recargaRoutes);
app.use('/api/retiros', retiroRoutes);
app.use('/api/cuentas-bancarias', bankAccountRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ mensaje: '✓ Banco Exclusivo Backend - Servidor en línea' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║   BANCO EXCLUSIVO - BACKEND        ║`);
  console.log(`║   Servidor corriendo en:           ║`);
  console.log(`║   http://localhost:${PORT}          ║`);
  console.log(`╚════════════════════════════════════╝\n`);
});
