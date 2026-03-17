import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import styles from './MarketTicker.module.css';

// Iconos SVG simples para cada activo
const icons = {
  'S&P 500': (
    <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 11V7a4 4 0 00-8 0v4M5 11h14" /></svg>
  ),
  'Dow Jones': (
    <svg className="w-5 h-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
  ),
  'Bitcoin': (
    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f2a900" /><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">₿</text></svg>
  ),
  'SPDR S&P 500 ETF': (
    <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
  ),
  'Vanguard S&P 500 ETF': (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 16l4-8 4 8" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
  ),
  'Oro': (
    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFD700" /></svg>
  ),
  'Petróleo': (
    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6" fill="#444" /></svg>
  ),
  'Euro/Dólar': (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#2563eb">€/$</text></svg>
  ),
  'Dólar/MXN': (
    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#16a34a">$/M</text></svg>
  ),
  'Peso Dominicano/USD': (
    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#a21caf">RD$</text></svg>
  ),
};

const getColor = (change) => {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
};

export default function MarketTicker({ position = 'web' }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevPrices = useRef({});
  const [bounced, setBounced] = useState({});

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data } = await axios.get('/api/market-data');
        // Detectar cambios de precio para animar
        const newBounced = {};
        data.assets.forEach((asset) => {
          if (
            prevPrices.current[asset.symbol] !== undefined &&
            prevPrices.current[asset.symbol] !== asset.price
          ) {
            newBounced[asset.symbol] = true;
            setTimeout(() => {
              setBounced((b) => ({ ...b, [asset.symbol]: false }));
            }, 700);
          }
        });
        setBounced((b) => ({ ...b, ...newBounced }));
        setAssets(data.assets);
        prevPrices.current = Object.fromEntries(
          data.assets.map((a) => [a.symbol, a.price])
        );
      } catch {
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const containerClass =
    position === 'mobile'
      ? 'fixed bottom-0 left-0 w-full bg-white border-t z-50 flex justify-around py-2 shadow-md'
      : 'absolute top-4 right-4 bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 min-w-[260px]';

  return (
    <div className={containerClass + ' ' + styles.fadeIn}>
      {loading ? (
        <span className="text-gray-400">Cargando...</span>
      ) : (
        assets.map((asset) => (
          <div
            key={asset.symbol}
            className={
              'flex flex-row items-center gap-2 mx-2 min-w-[120px] transition-all duration-300 ' +
              (bounced[asset.symbol] ? styles.bounce : '')
            }
          >
            {icons[asset.name] || <span className="w-5 h-5" />}
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">{asset.name}</span>
              <span className="font-semibold text-base">
                {asset.price !== null ? asset.price.toLocaleString() : '--'}
              </span>
              <span className={`text-xs ${getColor(asset.change)}`}>
                {asset.change !== null
                  ? `${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}%`
                  : '--'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
