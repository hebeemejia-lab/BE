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
        <p>Selecciona tu divisa preferida para visualizar todos los montos</p>
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
            <h4>Tasas de Cambio Actuales (Base: USD)</h4>
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
                  1 USD = {exchangeRates[curr]?.toFixed(4)} {curr}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="currency-info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <p><strong>Detección automática:</strong> El sistema detecta tu ubicación y sugiere la divisa de tu región.</p>
            <p><strong>Actualización:</strong> Las tasas de cambio se actualizan automáticamente cada hora.</p>
            <p><strong>Conversión:</strong> Todos los montos se muestran en {currencyNames[currency]} utilizando el símbolo {getCurrencySymbol()}.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySelector;
