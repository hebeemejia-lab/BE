const axios = require('axios');

// Alpaca Trading API Service
// Paper Trading (simulado con precios reales) para integración con saldo BE

const getConfig = () => ({
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  baseUrl: process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
});

// Headers de autenticación
const getHeaders = () => {
  const config = getConfig();
  return {
    'APCA-API-KEY-ID': config.apiKey,
    'APCA-API-SECRET-KEY': config.secretKey,
    'Content-Type': 'application/json',
  };
};

// Obtener cotización actual de una acción
const obtenerCotizacion = async (symbol) => {
  const config = getConfig();
  
  try {
    console.log(`📊 Obteniendo cotización de ${symbol}...`);
    
    const response = await axios.get(
      `${config.baseUrl}/v2/stocks/${symbol}/quotes/latest`,
      { headers: getHeaders() }
    );

    const quote = response.data.quote;
    const precio = quote.ap || quote.bp || 0; // ask price o bid price

    console.log(`✅ ${symbol}: $${precio.toFixed(2)}`);

    return {
      symbol,
      precio: parseFloat(precio.toFixed(2)),
      precioCompra: parseFloat((quote.ap || 0).toFixed(2)),
      precioVenta: parseFloat((quote.bp || 0).toFixed(2)),
      timestamp: quote.t,
    };
  } catch (error) {
    console.error(`❌ Error obteniendo cotización de ${symbol}:`, error.message);
    
    // Fallback a última cotización de cierre
    try {
      const fallback = await obtenerUltimoCierre(symbol);
      return fallback;
    } catch (fallbackError) {
      throw new Error(`No se pudo obtener precio de ${symbol}: ${error.message}`);
    }
  }
};

// Obtener último precio de cierre
const obtenerUltimoCierre = async (symbol) => {
  const config = getConfig();
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/stocks/${symbol}/bars/latest`,
      {
        headers: getHeaders(),
        params: { feed: 'iex' },
      }
    );

    const bar = response.data.bar;
    const precio = bar.c; // closing price

    console.log(`📈 ${symbol} (cierre): $${precio.toFixed(2)}`);

    return {
      symbol,
      precio: parseFloat(precio.toFixed(2)),
      precioCompra: parseFloat(precio.toFixed(2)),
      precioVenta: parseFloat(precio.toFixed(2)),
      timestamp: bar.t,
    };
  } catch (error) {
    throw new Error(`Error obteniendo último cierre de ${symbol}: ${error.message}`);
  }
};

// Obtener múltiples cotizaciones
const obtenerCotizaciones = async (symbols) => {
  try {
    const promesas = symbols.map(symbol => obtenerCotizacion(symbol));
    const cotizaciones = await Promise.all(promesas);
    
    return cotizaciones.reduce((acc, cot) => {
      acc[cot.symbol] = cot;
      return acc;
    }, {});
  } catch (error) {
    console.error('❌ Error obteniendo cotizaciones múltiples:', error.message);
    throw error;
  }
};

// Buscar acción por símbolo o nombre
const buscarAccion = async (query) => {
  const config = getConfig();
  
  try {
    console.log(`🔍 Buscando: ${query}...`);
    
    const response = await axios.get(
      `${config.baseUrl}/v2/assets`,
      {
        headers: getHeaders(),
        params: {
          status: 'active',
          asset_class: 'us_equity',
        },
      }
    );

    const queryUpper = query.toUpperCase();
    const resultados = response.data
      .filter(asset => 
        asset.symbol.includes(queryUpper) || 
        asset.name.toUpperCase().includes(queryUpper)
      )
      .slice(0, 10)
      .map(asset => ({
        symbol: asset.symbol,
        nombre: asset.name,
        exchange: asset.exchange,
        tradeable: asset.tradable,
      }));

    console.log(`✅ Encontrados ${resultados.length} resultados`);
    return resultados;
  } catch (error) {
    console.error('❌ Error buscando acción:', error.message);
    throw new Error(`Error buscando: ${error.message}`);
  }
};

// Validar que una acción existe y es negociable
const validarAccion = async (symbol) => {
  const config = getConfig();
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/assets/${symbol}`,
      { headers: getHeaders() }
    );

    const asset = response.data;

    if (!asset.tradable) {
      throw new Error(`${symbol} no es negociable`);
    }

    return {
      valid: true,
      symbol: asset.symbol,
      nombre: asset.name,
      exchange: asset.exchange,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Acción ${symbol} no encontrada`);
    }
    throw new Error(`Error validando ${symbol}: ${error.message}`);
  }
};

// Obtener estado de la cuenta (paper trading)
const obtenerEstadoCuenta = async () => {
  const config = getConfig();
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/account`,
      { headers: getHeaders() }
    );

    return {
      efectivo: parseFloat(response.data.cash),
      poderCompra: parseFloat(response.data.buying_power),
      valorPortfolio: parseFloat(response.data.portfolio_value),
      equity: parseFloat(response.data.equity),
    };
  } catch (error) {
    console.error('❌ Error obteniendo cuenta Alpaca:', error.message);
    return null;
  }
};

// Obtener historial de barras (gráficos)
const obtenerHistorial = async (symbol, timeframe = '1Day', limit = 100) => {
  const config = getConfig();
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/stocks/${symbol}/bars`,
      {
        headers: getHeaders(),
        params: {
          timeframe,
          limit,
          feed: 'iex',
        },
      }
    );

    return response.data.bars.map(bar => ({
      timestamp: bar.t,
      open: parseFloat(bar.o.toFixed(2)),
      high: parseFloat(bar.h.toFixed(2)),
      low: parseFloat(bar.l.toFixed(2)),
      close: parseFloat(bar.c.toFixed(2)),
      volume: bar.v,
    }));
  } catch (error) {
    console.error(`❌ Error obteniendo historial de ${symbol}:`, error.message);
    throw error;
  }
};

module.exports = {
  obtenerCotizacion,
  obtenerCotizaciones,
  obtenerUltimoCierre,
  buscarAccion,
  validarAccion,
  obtenerEstadoCuenta,
  obtenerHistorial,
};
