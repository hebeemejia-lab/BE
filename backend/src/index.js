const isRenderRuntime = process.env.RENDER === 'true' || Boolean(process.env.RENDER_EXTERNAL_URL);

// In Render production, rely on platform environment variables.
// This prevents local backend/.env values (e.g. PORT=5000) from leaking into deployment.
if (!isRenderRuntime) {
  require('dotenv').config();
}
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');
// Importar modelos para inicializar relaciones
const models = require('./models');
const { spawn } = require('child_process');

// Rutas - v2.3 with PayPal Payouts (automatic withdrawals)
const authRoutes = require('./routes/authRoutes');
const transferRoutes = require('./routes/transferRoutes');
const loanRoutes = require('./routes/loanRoutes');
const carterCardRoutes = require('./routes/carterCardRoutes');
const recargaRoutes = require('./routes/recargaRoutes');
const retiroRoutes = require('./routes/retiroRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const transferenciaInternacionalRoutes = require('./routes/transferenciaInternacionalRoutes');
const faqRoutes = require('./routes/faqRoutes');
const faqFeedbackRoutes = require('./routes/faqFeedbackRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminRetiroRoutes = require('./routes/adminRetiroRoutes');
const inversionesRoutes = require('./routes/inversionesRoutes');
const fundingAlpacaRoutes = require('./routes/fundingAlpacaRoutes');
const expensesRoutes = require('./routes/expenses');

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
  'https://be-2-3wc8.onrender.com',
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
app.use('/faq-feedback', faqFeedbackRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', adminRetiroRoutes);
app.use('/inversiones', inversionesRoutes);
app.use('/funding/alpaca', fundingAlpacaRoutes);
const fondoRiesgoRoutes = require('./routes/fondoRiesgoRoutes'); // Importar las rutas de fondoRiesgo
app.use('/fondo-riesgo', fondoRiesgoRoutes); // Agregar fondoRiesgoRoutes a las rutas principales
app.use('/', expensesRoutes); // Montar rutas de gastos personales


// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ 
    mensaje: '✓ Banco Exclusivo Backend - Servidor en línea',
    version: '2.3',
    features: ['auth', 'transferencias', 'transferencias-internacionales', 'recargas-rapyd', 'prestamos', 'retiros', 'inversiones']
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
const parsedPort = Number.parseInt(process.env.PORT, 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0
  ? parsedPort
  : (process.env.NODE_ENV === 'production' ? 10000 : 5000);
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces, no solo localhost

if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
  console.warn('⚠️  process.env.PORT no definido en producción. Usando fallback 10000.');
}

console.log('📌 Runtime env:', {
  NODE_ENV: process.env.NODE_ENV,
  RENDER: process.env.RENDER,
  PORT_ENV: process.env.PORT || '(undefined)',
  PORT_USADO: PORT,
});

const server = app.listen(PORT, HOST, () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║   BANCO EXCLUSIVO - BACKEND        ║`);
  console.log(`║   Servidor corriendo en:           ║`);
  console.log(`║   Puerto: ${PORT}                    ║`);
  console.log(`║   Host: ${HOST}                      ║`);
  console.log(`╚════════════════════════════════════╝\n`);

  // Ejecutar migraciones en background después de que el servidor esté listo
  console.log('⏳ Ejecutando migraciones en background...');
  const migrate = spawn('node', [path.join(__dirname, '..', 'migrate.js')], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  migrate.stdout.on('data', (data) => {
    console.log(`[MIGRATE] ${data.toString().trim()}`);
  });

  migrate.stderr.on('data', (data) => {
    console.log(`[MIGRATE] ⚠️  ${data.toString().trim()}`);
  });

  migrate.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Migraciones completadas exitosamente');
    } else {
      console.log(`⚠️  Migraciones completadas con código ${code} (no crítico)`);
    }
  });
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
  process.exit(1);
});
