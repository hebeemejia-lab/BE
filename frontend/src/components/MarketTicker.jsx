import React, { useEffect, useState } from 'react';
import API from '../services/api';
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

const getIsMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

export default function MarketTicker({ position = 'web' }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState('fresh');
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [isMobileView, setIsMobileView] = useState(getIsMobileViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => setIsMobileView(getIsMobileViewport());
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para obtener datos del mercado
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data } = await API.get('/market-data');
        // Capturar estado de datos (fresh, cached, stale)
        const status = data.stale ? 'stale' : data.cached ? 'cached' : 'fresh';
        setDataStatus(status);
        setAssets(data.assets);
      } catch {
        setAssets([]);
        setDataStatus('error');
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Efecto para carrusel de activos con transición de fade
  useEffect(() => {
    if (assets.length === 0) return;

    let transitionTimeout;
    const carouselInterval = setInterval(() => {
      setFadeOut(true);
      transitionTimeout = setTimeout(() => {
        setCurrentAssetIndex((prev) => (prev + 1) % assets.length);
        setFadeOut(false);
      }, 300);
    }, 3500);

    return () => {
      clearInterval(carouselInterval);
      if (transitionTimeout) clearTimeout(transitionTimeout);
    };
  }, [assets]);

  const statusIndicators = {
    fresh: { emoji: '✅', label: 'Datos en vivo', color: '#10b981' },
    cached: { emoji: '📦', label: 'Datos en caché', color: '#f59e0b' },
    stale: { emoji: '⏰', label: 'Datos no actualizados', color: '#ef4444' },
    error: { emoji: '❌', label: 'Error de conexión', color: '#ef4444' }
  };

  const indicator = statusIndicators[dataStatus] || statusIndicators.fresh;

  const shouldUseInlineMobileLayout = isMobileView || position === 'mobile';

  const containerClass =
    shouldUseInlineMobileLayout
      ? 'relative w-full bg-white border border-gray-200 rounded-xl shadow-md px-4 py-4 flex flex-col gap-3 mb-4'
      : 'absolute top-4 right-4 bg-white rounded-lg shadow-md p-6 flex flex-col gap-4 w-[320px]';

  const currentAsset = assets[currentAssetIndex];

  return (
    <div className={containerClass + ' ' + styles.fadeIn}>
      {/* Indicador de estado */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: indicator.color,
        fontWeight: 500
      }}>
        <span>{indicator.emoji}</span>
        <span>{indicator.label}</span>
      </div>

      {/* Carrusel de activos */}
      {loading ? (
        <div className="text-center text-gray-400">Cargando...</div>
      ) : assets.length > 0 ? (
        <>
          {/* Contenedor del activo con transición fade */}
          <div
            style={{
              opacity: fadeOut ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
              minHeight: shouldUseInlineMobileLayout ? '118px' : '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            {currentAsset && (
              <>
                {/* Icono */}
                <div className="mb-3">
                  {icons[currentAsset.name] || <span className="w-8 h-8" />}
                </div>

                {/* Nombre */}
                <div className="text-sm text-gray-600 font-medium mb-2">
                  {currentAsset.name}
                </div>

                {/* Precio */}
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {currentAsset.price !== null
                    ? currentAsset.price.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : '--'}
                </div>

                {/* Símbolo */}
                <div className="text-xs text-gray-400 mb-3">{currentAsset.symbol}</div>

                {/* Cambio porcentual */}
                <div className={`text-lg font-semibold ${getColor(currentAsset.change)}`}>
                  {currentAsset.change !== null
                    ? `${currentAsset.change > 0 ? '↑ +' : '↓ '}${Math.abs(currentAsset.change).toFixed(2)}%`
                    : '--'}
                </div>
              </>
            )}
          </div>

          {/* Indicador de progreso */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '12px',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            <span>{currentAssetIndex + 1} de {assets.length}</span>
            {/* Barras de progreso */}
            <div style={{
              display: 'flex',
              gap: '4px'
            }}>
              {assets.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: idx === currentAssetIndex ? '#3b82f6' : '#d1d5db',
                    transition: 'background-color 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400">No hay datos disponibles</div>
      )}
    </div>
  );
}
