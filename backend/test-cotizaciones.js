// Prueba automatizada para obtenerCotizacionResiliente
const { obtenerCotizacionResiliente } = require('./src/services/cotizacionesService');

async function testCotizaciones() {
  const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA'];
  for (const symbol of symbols) {
    try {
      const cot = await obtenerCotizacionResiliente(symbol);
      console.log(`✅ ${symbol}:`, cot);
    } catch (err) {
      console.error(`❌ Error para ${symbol}:`, err.message);
    }
  }
}

testCotizaciones();
