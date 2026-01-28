const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(express.static(path.join(__dirname, 'build')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    frontend: 'Banco Exclusivo Frontend',
    version: '2.2'
  });
});

// SPA Fallback - Servir index.html para todas las rutas no encontradas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`✅ Frontend Server running on port ${PORT}`);
  console.log(`📍 Serving from: ${path.join(__dirname, 'build')}`);
});
