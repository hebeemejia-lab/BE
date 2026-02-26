import React, { useContext } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import './CurrencySelector.css';

const CurrencySelector = () => {
  const { 
    currency, 
    changeCurrency, 
    exchangeRates, 
    loading,
    fetchExchangeRates,
    availableCurrencies,
    currencyNames,
    getCurrencySymbol
  } = useContext(CurrencyContext);

  const handleCurrencyChange = (e) => {
    changeCurrency(e.target.value);
  };

  const handleRefresh = async () => {
    await fetchExchangeRates();
  };

  return (
    <div className="currency-selector-container">
      <div className="currency-selector-header">
        <h3>💱 Configuración de Divisa</h3>
        <p>Selecciona en qué divisa deseas visualizar todos los montos (los valores se almacenan en DOP)</p>
      </div>
      
      <div className="currency-selector-content">
        <div className="currency-select-wrapper">
          <label htmlFor="currency-select">Divisa actual:</label>
          <select 
            id="currency-select"
            value={currency} 
            onChange={handleCurrencyChange}
            className="currency-select"
            disabled={loading}
          >
            {availableCurrencies.map(curr => (
              <option key={curr} value={curr}>
                {currencyNames[curr]}
              </option>
            ))}
          </select>
        </div>

        <div className="exchange-rates-info">
          <div className="exchange-rates-header">
            <h4>Tasas de Cambio Actuales (Base: DOP)</h4>
            <button 
              onClick={handleRefresh}
              className="refresh-btn"
              disabled={loading}
              title="Actualizar tasas de cambio"
            >
              {loading ? '🔄' : '↻'} Actualizar
            </button>
          </div>
          
          <div className="rates-grid">
            {availableCurrencies.map(curr => (
              <div 
                key={curr} 
                className={`rate-card ${curr === currency ? 'active' : ''}`}
              >
                <div className="rate-currency">
                  <span className="rate-symbol">{currencyNames[curr]}</span>
                </div>
                <div className="rate-value">
                  1 DOP = {exchangeRates[curr]?.toFixed(4)} {curr}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="currency-info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <p><strong>Moneda base:</strong> Todos los valores están almacenados en Pesos Dominicanos (DOP).</p>
            <p><strong>Conversión:</strong> Selecciona una divisa para visualizar los montos convertidos usando tasas de cambio en tiempo real.</p>
            <p><strong>Actualización:</strong> Las tasas se actualizan automáticamente cada hora o puedes actualizarlas manualmente.</p>
            <p><strong>Ejemplo:</strong> Si tienes RD$1,000 y seleccionas USD, verás aproximadamente ${(1000 * (exchangeRates.USD || 0.017)).toFixed(2)}.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySelector;
