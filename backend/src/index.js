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


console.log('🟢 [Express] Cargando rutas...');
const authRoutes = require('./routes/authRoutes');
console.log('🟢 [Express] authRoutes cargado');
const transferRoutes = require('./routes/transferRoutes');
console.log('🟢 [Express] transferRoutes cargado');
const loanRoutes = require('./routes/loanRoutes');
console.log('🟢 [Express] loanRoutes cargado');
const carterCardRoutes = require('./routes/carterCardRoutes');
console.log('🟢 [Express] carterCardRoutes cargado');
const recargaRoutes = require('./routes/recargaRoutes');
console.log('🟢 [Express] recargaRoutes cargado');
const retiroRoutes = require('./routes/retiroRoutes');
console.log('🟢 [Express] retiroRoutes cargado');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
console.log('🟢 [Express] bankAccountRoutes cargado');
const transferenciaInternacionalRoutes = require('./routes/transferenciaInternacionalRoutes');
console.log('🟢 [Express] transferenciaInternacionalRoutes cargado');
const faqRoutes = require('./routes/faqRoutes');
console.log('🟢 [Express] faqRoutes cargado');
const faqFeedbackRoutes = require('./routes/faqFeedbackRoutes');
console.log('🟢 [Express] faqFeedbackRoutes cargado');
const adminRoutes = require('./routes/adminRoutes');
console.log('🟢 [Express] adminRoutes cargado');
const adminRetiroRoutes = require('./routes/adminRetiroRoutes');
console.log('🟢 [Express] adminRetiroRoutes cargado');
const inversionesRoutes = require('./routes/inversionesRoutes');
console.log('🟢 [Express] inversionesRoutes cargado');
const fundingAlpacaRoutes = require('./routes/fundingAlpacaRoutes');
console.log('🟢 [Express] fundingAlpacaRoutes cargado');
const expensesRoutes = require('./routes/expenses');
console.log('🟢 [Express] expensesRoutes cargado');
const forumRoutes = require('./routes/forumRoutes');
console.log('🟢 [Express] forumRoutes cargado');
const bybitService = require('./services/bybitService');
console.log('🟢 [Express] bybitService cargado');



console.log('🟢 [Express] Inicializando app Express...');
const app = express();
console.log('🟢 [Express] App Express inicializada');

console.log('🚦 Iniciando backend Express...');
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 60) + '...' : 'NO DEFINIDA');
console.log('⏳ Conectando a la base de datos...');
connectDB()
  .then(() => {
    console.log('✅ Conexión a base de datos exitosa (connectDB)');
  })
  .catch((err) => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });

// Middlewares
const frontendUrl = (process.env.FRONTEND_URL || '').trim();

const allowedOrigins = [
  'https://bancoexclusivo.lat',
  'https://www.bancoexclusivo.lat',
  'http://localhost:3000',
  'http://localhost:3001',
];

// Agregar FRONTEND_URL si está configurado y no está vacío
if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
  allowedOrigins.push(frontendUrl);
}

console.log('🔐 CORS Origins permitidos:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
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
};
app.use(cors(corsOptions));
// Permitir preflight para todas las rutas con la misma config
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas

console.log('🟢 [Express] Montando rutas en app...');
app.use('/auth', authRoutes); console.log('🟢 [Express] /auth montado');
app.use('/transferencias', transferRoutes); console.log('🟢 [Express] /transferencias montado');
app.use('/transferencias-internacionales', transferenciaInternacionalRoutes); console.log('🟢 [Express] /transferencias-internacionales montado');
app.use('/prestamos', loanRoutes); console.log('🟢 [Express] /prestamos montado');
app.use('/carter-card', carterCardRoutes); console.log('🟢 [Express] /carter-card montado');
app.use('/recargas', recargaRoutes); console.log('🟢 [Express] /recargas montado');
app.use('/retiros', retiroRoutes); console.log('🟢 [Express] /retiros montado');
app.use('/cuentas-bancarias', bankAccountRoutes); console.log('🟢 [Express] /cuentas-bancarias montado');
app.use('/faq', faqRoutes); console.log('🟢 [Express] /faq montado');
app.use('/faq-feedback', faqFeedbackRoutes); console.log('🟢 [Express] /faq-feedback montado');
app.use('/admin', adminRoutes); console.log('🟢 [Express] /admin montado');
app.use('/admin', adminRetiroRoutes); console.log('🟢 [Express] /admin (retiro) montado');
app.use('/inversiones', inversionesRoutes); console.log('🟢 [Express] /inversiones montado');
app.use('/funding/alpaca', fundingAlpacaRoutes); console.log('🟢 [Express] /funding/alpaca montado');
app.use('/foro', forumRoutes); console.log('🟢 [Express] /foro montado');
const fondoRiesgoRoutes = require('./routes/fondoRiesgoRoutes'); // Importar las rutas de fondoRiesgo
console.log('🟢 [Express] fondoRiesgoRoutes cargado');
app.use('/fondo-riesgo', fondoRiesgoRoutes); console.log('🟢 [Express] /fondo-riesgo montado');
app.use('/', expensesRoutes); console.log('🟢 [Express] / (expenses) montado');
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

app.get('/debug/bybit', async (req, res) => {
  const configuredToken = String(process.env.BYBIT_DEBUG_TOKEN || '').trim();
  const requestToken = String(req.query.token || '').trim();

  if (configuredToken && configuredToken !== requestToken) {
    return res.status(401).json({ mensaje: 'Token de debug inválido' });
  }

  const key = String(process.env.BYBIT_API_KEY || '');
  const secret = String(process.env.BYBIT_API_SECRET || '');
  const result = {
    env: {
      bybitBaseUrl: process.env.BYBIT_BASE_URL || null,
      bybitKeyLength: key.length,
      bybitSecretLength: secret.length,
      bybitKeyPreview: key ? `${key.slice(0, 4)}***${key.slice(-3)}` : '',
    },
    checks: {
      public: { ok: false, error: null, data: null },
      private: { ok: false, error: null, rows: null },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const quote = await bybitService.getSpotPriceUsd('BTC');
    result.checks.public.ok = true;
    result.checks.public.data = quote;
  } catch (error) {
    result.checks.public.error = error.message;
  }

  try {
    const rows = await bybitService.queryWithdrawalRecords({ limit: 1 });
    result.checks.private.ok = true;
    result.checks.private.rows = Array.isArray(rows) ? rows.length : 0;
  } catch (error) {
    result.checks.private.error = error.message;
  }

  return res.status(200).json(result);
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
  console.log('🟠 [Express] Petición llegó al middleware 404:', req.method, req.originalUrl);
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Compatibilidad local y serverless (Vercel)
if (process.env.VERCEL || process.env.SERVERLESS) {
  // Solo exportar app para serverless (Vercel)
  module.exports = app;
} else {
  // Iniciar servidor localmente
  const parsedPort = Number.parseInt(process.env.PORT, 10);
  const PORT = Number.isInteger(parsedPort) && parsedPort > 0
    ? parsedPort
    : (process.env.NODE_ENV === 'production' ? 10000 : 5000);
  const HOST = '0.0.0.0';

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
}
