const express = require('express');
const axios = require('axios');
const router = express.Router();

// Yahoo Finance symbols for requested assets
const SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { symbol: 'GC=F', name: 'Oro' }, // Gold Futures
  { symbol: 'CL=F', name: 'Petróleo' }, // Crude Oil Futures
  { symbol: 'EURUSD=X', name: 'Euro/Dólar' },
  { symbol: 'USDMXN=X', name: 'Dólar/MXN' },
  { symbol: 'DOPUSD=X', name: 'Peso Dominicano/USD' } // DOP: Peso Dominicano (Yahoo symbol)
];

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CACHE_TTL_MS = 60 * 1000;

let marketCache = {
  timestamp: 0,
  assets: null,
};

const getNullAssets = () =>
  SYMBOLS.map(({ symbol, name }) => ({
    name,
    symbol,
    price: null,
    change: null,
  }));

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const fetchSymbolData = async ({ symbol, name }) => {
  try {
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}`;
    const { data } = await axios.get(url, {
      params: {
        interval: '1d',
        range: '5d',
      },
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BancoExclusivoMarketTicker/1.0)',
      },
    });

    const result = data?.chart?.result?.[0];
    const meta = result?.meta || {};
    const closes = result?.indicators?.quote?.[0]?.close || [];

    const priceFromMeta = toNumber(meta.regularMarketPrice);
    const lastClose = toNumber(closes.slice().reverse().find((v) => Number.isFinite(Number(v))));
    const price = priceFromMeta ?? lastClose;

    const prevFromMeta = toNumber(meta.previousClose ?? meta.chartPreviousClose);
    const secondLastClose = toNumber(
      closes
        .slice()
        .reverse()
        .filter((v) => Number.isFinite(Number(v)))[1]
    );
    const prev = prevFromMeta ?? secondLastClose;

    const change = price !== null && prev !== null && prev !== 0
      ? ((price - prev) / prev) * 100
      : null;

    return {
      name,
      symbol,
      price,
      change,
    };
  } catch (error) {
    console.warn(`⚠️ marketData fallo para ${symbol}:`, error?.response?.status || error.message);
    return {
      name,
      symbol,
      price: null,
      change: null,
    };
  }
};

router.get('/market-data', async (req, res) => {
  try {
    const now = Date.now();
    if (marketCache.assets && now - marketCache.timestamp < CACHE_TTL_MS) {
      return res.json({ assets: marketCache.assets, cached: true });
    }

    const assets = await Promise.all(SYMBOLS.map(fetchSymbolData));
    const hasData = assets.some((asset) => asset.price !== null);

    if (hasData) {
      marketCache = {
        timestamp: now,
        assets,
      };
      return res.json({ assets, cached: false });
    }

    if (marketCache.assets) {
      return res.json({ assets: marketCache.assets, stale: true });
    }

    return res.json({ assets: getNullAssets(), stale: true });
  } catch (err) {
    console.error('❌ marketData error:', err.message);

    if (marketCache.assets) {
      return res.json({ assets: marketCache.assets, stale: true });
    }

    return res.json({ assets: getNullAssets(), stale: true });
  }
});

module.exports = router;