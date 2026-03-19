/**
 * useMarketData
 * Simulates a WebSocket feed for live crypto/stock prices.
 * In production replace the mock with a real WS endpoint:
 *   const ws = new WebSocket('wss://your-exchange.com/stream');
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_PRICES = {
  BTC:  { price: 68_420.50, change24h:  1.84, volume24h: 38_400_000_000 },
  ETH:  { price:  3_512.30, change24h: -0.73, volume24h: 18_200_000_000 },
  SOL:  { price:    175.80, change24h:  3.12, volume24h:  4_900_000_000 },
  BNB:  { price:    601.40, change24h:  0.45, volume24h:  2_100_000_000 },
  ADA:  { price:      0.62, change24h: -1.20, volume24h:    820_000_000 },
  DOGE: { price:      0.18, change24h:  5.33, volume24h:  1_500_000_000 },
};

function jitter(value, pct = 0.003) {
  return value * (1 + (Math.random() * 2 - 1) * pct);
}

/**
 * @returns {{ prices: typeof INITIAL_PRICES, connected: boolean, lastUpdate: Date }}
 */
export function useMarketData() {
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const connect = useCallback(() => {
    // Simulate WS "open" after 600 ms
    const connectTimer = setTimeout(() => setConnected(true), 600);

    // Tick every 2 s – simulates incoming WS messages
    intervalRef.current = setInterval(() => {
      setPrices((prev) => {
        const next = {};
        for (const [sym, data] of Object.entries(prev)) {
          const newPrice  = Math.max(0.0001, jitter(data.price));
          const newChange = data.change24h + (Math.random() - 0.5) * 0.04;
          const newVol    = Math.max(0, jitter(data.volume24h, 0.005));
          next[sym] = { price: newPrice, change24h: Number(newChange.toFixed(2)), volume24h: newVol };
        }
        return next;
      });
      setLastUpdate(new Date());
    }, 2000);

    return connectTimer;
  }, []);

  useEffect(() => {
    const connectTimer = connect();
    return () => {
      clearTimeout(connectTimer);
      clearInterval(intervalRef.current);
      setConnected(false);
    };
  }, [connect]);

  return { prices, connected, lastUpdate };
}

/**
 * useBalance
 * Simulates a REST call to GET /api/user/balance.
 * Replace fetchBalance with a real axios call in production.
 */
export function useBalance() {
  const [balance, setBalance]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchBalance = () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              usd:        12_480.30,
              staked:      2_150.00,
              collateral:  5_000.00,
              nfts:            8,
              cardLimit:   1_000.00,
              cardSpent:     247.50,
            }),
          800,
        ),
      );

    fetchBalance()
      .then((data) => { if (!cancelled) { setBalance(data); setLoading(false); } })
      .catch((e)   => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, []);

  return { balance, loading, error };
}
