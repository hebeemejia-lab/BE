require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB } = require('./config/database');

// Rutas - v2.1 with Rapyd checkout integration
const authRoutes = require('./routes/authRoutes');
const transferRoutes = require('./routes/transferRoutes');
const loanRoutes = require('./routes/loanRoutes');
const carterCardRoutes = require('./routes/carterCardRoutes');
const recargaRoutes = require('./routes/recargaRoutes');
const retiroRoutes = require('./routes/retiroRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const transferenciaInternacionalRoutes = require('./routes/transferenciaInternacionalRoutes');
const faqRoutes = require('./routes/faqRoutes');

const app = express();

// Conectar a SQLite
connectDB();

// Middlewares
const frontendUrl = (process.env.FRONTEND_URL || '').trim();
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.bancoexclusivo.lat',
  'https://bancoexclusivo.lat',
  'http://www.bancoexclusivo.lat',
  'http://bancoexclusivo.lat',
];

// Agregar FRONTEND_URL si está configurado y no está vacío
if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
  allowedOrigins.push(frontendUrl);
}

console.log('🔐 CORS Origins permitidos:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) o si está en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Permitir preflight para todas las rutas
app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/auth', authRoutes);
app.use('/transferencias', transferRoutes);
app.use('/transferencias-internacionales', transferenciaInternacionalRoutes);
app.use('/prestamos', loanRoutes);
app.use('/carter-card', carterCardRoutes);
app.use('/recargas', recargaRoutes);
app.use('/retiros', retiroRoutes);
app.use('/cuentas-bancarias', bankAccountRoutes);
app.use('/faq', faqRoutes);

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ 
    mensaje: '✓ Banco Exclusivo Backend - Servidor en línea',
    version: '2.2',
    features: ['auth', 'transferencias', 'transferencias-internacionales', 'recargas-rapyd', 'prestamos', 'retiros']
  });
});

// Endpoint de debug - listar todas las rutas
app.get('/debug/routes', (req, res) => {
  res.json({
    message: 'Rutas disponibles',
    routes: {
      auth: [
        'POST /auth/registro',
        'POST /auth/login',
        'GET /auth/perfil',
      ],
      recargas: [
        'GET /recargas/debug',
        'POST /recargas/crear (Stripe)',
        'POST /recargas/crear-rapyd ← RAPYD',
        'POST /recargas/webhook-rapyd ← WEBHOOK',
        'POST /recargas/procesar-tarjeta',
        'POST /recargas/procesar',
        'GET /recargas/historial',
        'POST /recargas/canjear-codigo',
      ],
      transferencias: [
        'GET /transferencias',
        'POST /transferencias',
      ],
      prestamos: [
        'GET /prestamos',
        'POST /prestamos',
      ],
    }
  });
});

// Endpoint de prueba para recargas
app.get('/recargas/test', (req, res) => {
  res.json({ 
    message: '✅ Recargas endpoint is working',
    timestamp: new Date().toISOString()
  });
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
