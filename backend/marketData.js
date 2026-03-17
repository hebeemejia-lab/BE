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

const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';

router.get('/market-data', async (req, res) => {
  try {
    const symbolsStr = SYMBOLS.map(s => s.symbol).join(',');
    const { data } = await axios.get(`${YAHOO_FINANCE_URL}?symbols=${symbolsStr}`);
    const results = data.quoteResponse.result;

    const formatted = SYMBOLS.map(({ symbol, name }) => {
      const found = results.find(r => r.symbol === symbol);
      return found
        ? {
            name,
            symbol,
            price: found.regularMarketPrice,
            change: found.regularMarketChangePercent
          }
        : { name, symbol, price: null, change: null };
    });

    res.json({ assets: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching market data' });
  }
});

module.exports = router;