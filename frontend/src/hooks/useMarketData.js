/**
 * useMarketData
 * Production feed backed by backend trading endpoints.
 * Fetches live quotes and recent bars, then refreshes on an interval.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { inversionesAPI } from '../services/api';

const MARKET_WATCHLIST = [
  { key: 'BTC', symbol: 'BTCUSD', label: 'Bitcoin', market: 'crypto' },
  { key: 'ETH', symbol: 'ETHUSD', label: 'Ethereum', market: 'crypto' },
  { key: 'SOL', symbol: 'SOLUSD', label: 'Solana', market: 'crypto' },
  { key: 'DOGE', symbol: 'DOGEUSD', label: 'Dogecoin', market: 'crypto' },
  { key: 'SPY', symbol: 'SPY', label: 'S&P 500', market: 'index' },
  { key: 'DIA', symbol: 'DIA', label: 'Dow Jones', market: 'index' },
];

const INITIAL_PRICES = {
  BTC: { price: 0, change24h: 0, volume24h: 0, market: 'crypto', label: 'Bitcoin' },
  ETH: { price: 0, change24h: 0, volume24h: 0, market: 'crypto', label: 'Ethereum' },
  SOL: { price: 0, change24h: 0, volume24h: 0, market: 'crypto', label: 'Solana' },
  DOGE: { price: 0, change24h: 0, volume24h: 0, market: 'crypto', label: 'Dogecoin' },
  SPY: { price: 0, change24h: 0, volume24h: 0, market: 'index', label: 'S&P 500' },
  DIA: { price: 0, change24h: 0, volume24h: 0, market: 'index', label: 'Dow Jones' },
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const calcPctChange = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
};

const fetchMarketEntry = async (item) => {
  const [quoteResult, historyResult] = await Promise.allSettled([
    inversionesAPI.obtenerCotizacion(item.symbol),
    inversionesAPI.obtenerHistorial(item.symbol, { timeframe: '1Day', limit: 2 }),
  ]);

  let price = 0;
  let change24h = 0;
  let volume24h = 0;

  if (quoteResult.status === 'fulfilled') {
    const quote = quoteResult.value?.data || {};
    price = toNumber(quote.precioCompra || quote.precio || quote.precioVenta, 0);
  }

  if (historyResult.status === 'fulfilled') {
    const bars = historyResult.value?.data?.datos || [];
    const lastBar = bars[bars.length - 1];
    const prevBar = bars[bars.length - 2];

    if (lastBar) {
      const close = toNumber(lastBar.close, price);
      const prevClose = toNumber(prevBar?.close, close);
      price = price || close;
      volume24h = toNumber(lastBar.volume, 0);
      change24h = calcPctChange(close, prevClose);
    }
  }

  if (!price) {
    throw new Error(`No se pudo obtener cotizacion para ${item.symbol}`);
  }

  return [
    item.key,
    {
      price,
      change24h: Number(change24h.toFixed(2)),
      volume24h,
      market: item.market,
      label: item.label,
      symbol: item.symbol,
    },
  ];
};

/**
 * @returns {{ prices: typeof INITIAL_PRICES, connected: boolean, lastUpdate: Date|null, error: string|null }}
 */
export function useMarketData() {
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const inFlightRef = useRef(false);

  const refreshQuotes = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    try {
      const results = await Promise.allSettled(MARKET_WATCHLIST.map(fetchMarketEntry));

      const successful = results.filter((result) => result.status === 'fulfilled');
      if (successful.length === 0) {
        setConnected(false);
        setError('No se pudieron actualizar cotizaciones en vivo.');
        return;
      }

      setPrices((prev) => {
        const merged = { ...prev };
        successful.forEach((result) => {
          const [key, data] = result.value;
          merged[key] = data;
        });
        return merged;
      });

      setConnected(true);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err?.message || 'Error consultando cotizaciones');
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshQuotes();

    intervalRef.current = setInterval(() => {
      refreshQuotes();
    }, 15000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [refreshQuotes]);

  return { prices, connected, lastUpdate, error };
}

/**
 * useBalance
 * Production balance from backend portfolio endpoint.
 */
export function useBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const refreshBalance = useCallback(async () => {
    try {
      const response = await inversionesAPI.obtenerPortfolio();
      const portfolio = response?.data || {};
      const stats = portfolio?.estadisticas || {};

      setBalance({
        usd: toNumber(portfolio.saldoDisponible, 0),
        staked: toNumber(stats.gananciaNoRealizada, 0),
        collateral: toNumber(portfolio.valorPortfolio, 0),
        nfts: 0,
        cardLimit: 0,
        cardSpent: 0,
        valorTotal: toNumber(portfolio.valorTotal, 0),
        gananciaRealizada: toNumber(stats.gananciaRealizada, 0),
        posicionesAbiertas: toNumber(stats.totalPosicionesAbiertas, 0),
      });
      setError(null);
    } catch (err) {
      setError(err?.message || 'Error obteniendo balance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();

    intervalRef.current = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [refreshBalance]);

  return { balance, loading, error };
}
