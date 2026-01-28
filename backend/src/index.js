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

const app = express();

// Conectar a SQLite
connectDB();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.bancoexclusivo.lat',
  'https://bancoexclusivo.lat',
  process.env.FRONTEND_URL
];
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) o si está en la lista
    if (!origin || allowedOrigins.some(o => o && origin === o)) {
      callback(null, true);
    } else {
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

// ============ ENDPOINT DIRECTO RAPYD RECARGA ============
// Este endpoint procesa pagos con Rapyd directamente
app.post('/recargas/crear-rapyd', require('./middleware/authMiddleware'), async (req, res) => {
  try {
    const { monto } = req.body;
    const usuarioId = req.usuario?.id;
    
    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto inválido' });
    }
    
    if (!usuarioId) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }
    
    // Importar Rapyd service
    const rapydService = require('./services/rapydService');
    const User = require('./models/User');
    const Recarga = require('./models/Recarga');
    
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    // Crear registro de recarga
    const recarga = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      comision: 0,
      metodo: 'rapyd',
      estado: 'pendiente',
      numeroReferencia: `REC-${Date.now()}`,
    });
    
    // Crear checkout con Rapyd
    const pago = await rapydService.crearPagoRecarga({
      monto,
      email: usuario.email,
      nombre: usuario.nombre || 'Usuario',
      apellido: usuario.apellido || 'Banco Exclusivo',
      usuarioId,
    });
    
    // Guardar referencia de Rapyd
    recarga.rapydCheckoutId = pago.id;
    recarga.rapydCheckoutUrl = pago.checkout_url;
    await recarga.save();
    
    console.log('✅ Checkout Rapyd creado:', {
      checkoutId: pago.id,
      checkoutUrl: pago.checkout_url,
    });
    
    return res.json({
      mensaje: 'Checkout creado',
      checkoutUrl: pago.checkout_url,
      checkoutId: pago.id,
      recargaId: recarga.id,
      monto: recarga.monto,
    });
    
  } catch (error) {
    console.error('❌ Error creando checkout:', error);
    return res.status(500).json({
      mensaje: 'Error al procesar el pago',
      error: error.message,
    });
  }
});

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ 
    mensaje: '✓ Banco Exclusivo Backend - Servidor en línea',
    version: '2.1',
    features: ['auth', 'transferencias', 'transferencias-internacionales', 'recargas-rapyd', 'prestamos', 'retiros']
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
