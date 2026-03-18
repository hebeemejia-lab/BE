import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CurrencyContext = createContext();

const DEFAULT_EXCHANGE_RATES = { DOP: 1, USD: 0.017, EUR: 0.016, GBP: 0.013 };
const EXCHANGE_RATE_ENDPOINTS = [
  'https://api.exchangerate-api.com/v4/latest/USD',
  'https://open.er-api.com/v6/latest/USD',
];
const GEOLOCATION_ENDPOINTS = [
  'https://ipapi.co/json/',
  'https://ipwho.is/',
];

const fetchJsonWithTimeout = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const extraerRates = (data) => data?.rates || null;

const extraerCountryCode = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return data.country_code || data.country_code_iso3 || data.country_code_iso2 || data.country || null;
};

const CURRENCY_SYMBOLS = {
  DOP: 'RD$',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const CURRENCY_NAMES = {
  DOP: 'Peso Dominicano (DOP)',
  USD: 'Dólar (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'Libra (GBP)'
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'DOP';
  });
  
  const [exchangeRates, setExchangeRates] = useState(() => {
    const cached = localStorage.getItem('exchangeRates');
    const cacheTime = localStorage.getItem('exchangeRatesTime');
    
    // Si el caché tiene menos de 1 hora, usarlo
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
      return JSON.parse(cached);
    }
    
    // Valores por defecto (1 DOP a otras monedas)
    return DEFAULT_EXCHANGE_RATES;
  });
  
  const [loading, setLoading] = useState(false);

  // Función para obtener tasas de cambio actualizadas (desde DOP a otras monedas)
  const fetchExchangeRates = useCallback(async (userLocation = null) => {
    setLoading(true);
    try {
      let data = null;

      for (const endpoint of EXCHANGE_RATE_ENDPOINTS) {
        try {
          data = await fetchJsonWithTimeout(endpoint);
          if (extraerRates(data)?.DOP) {
            break;
          }
        } catch (exchangeError) {
          data = null;
        }
      }

      if (!extraerRates(data)?.DOP) {
        throw new Error('No fue posible obtener tasas actualizadas');
      }
      
      // DOP normalmente está alrededor de 58-60 por USD
      const dopToUsd = extraerRates(data).DOP || 59; // Cuántos DOP = 1 USD
      
      // Calcular tasas desde DOP (1 DOP = ? USD/EUR/GBP)
      const rates = {
        DOP: 1,
        USD: 1 / dopToUsd, // Convertir de DOP a USD
        EUR: (1 / dopToUsd) * (extraerRates(data).EUR || 0.92), // DOP -> USD -> EUR
        GBP: (1 / dopToUsd) * (extraerRates(data).GBP || 0.79)  // DOP -> USD -> GBP
      };
      
      setExchangeRates(rates);
      
      // Guardar en caché
      localStorage.setItem('exchangeRates', JSON.stringify(rates));
      localStorage.setItem('exchangeRatesTime', Date.now().toString());
      
      // Si se pasó ubicación del usuario, detectar divisa preferida
      if (userLocation) {
        const detectedCurrency = detectCurrencyByLocation(userLocation);
        if (detectedCurrency && detectedCurrency !== currency) {
          changeCurrency(detectedCurrency);
        }
      }
      
    } catch (error) {
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        setExchangeRates(JSON.parse(cached));
      } else {
        setExchangeRates(DEFAULT_EXCHANGE_RATES);
      }
      console.warn('No se pudieron actualizar las tasas de cambio; se usan tasas en caché o por defecto.');
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Detectar divisa según ubicación del usuario
  const detectCurrencyByLocation = (location) => {
    // location puede ser código de país o coordenadas
    const euroCountries = ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'IE', 'FI', 'GR'];
    const gbpCountries = ['GB', 'UK'];
    const dominicanCountries = ['DO'];
    
    if (typeof location === 'string') {
      const countryCode = location.toUpperCase();
      if (dominicanCountries.includes(countryCode)) return 'DOP';
      if (euroCountries.includes(countryCode)) return 'EUR';
      if (gbpCountries.includes(countryCode)) return 'GBP';
    }
    
    return 'DOP'; // Por defecto peso dominicano
  };

  // Obtener ubicación del usuario usando API de geolocalización
  const getUserLocation = useCallback(async () => {
    try {
      for (const endpoint of GEOLOCATION_ENDPOINTS) {
        try {
          const data = await fetchJsonWithTimeout(endpoint, 5000);
          const countryCode = extraerCountryCode(data);
          if (countryCode) {
            return String(countryCode).slice(0, 2);
          }
        } catch (locationError) {
          // Probar siguiente endpoint.
        }
      }

      throw new Error('Error al obtener ubicación');
    } catch (error) {
      console.warn('No se pudo detectar ubicación automáticamente.');
      return null;
    }
  }, []);

  // Cambiar divisa seleccionada
  const changeCurrency = (newCurrency) => {
    if (CURRENCY_SYMBOLS[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('selectedCurrency', newCurrency);
    }
  };

  // Convertir monto de DOP a la divisa seleccionada
  const convertAmount = (amountDOP) => {
    const amount = parseFloat(amountDOP);
    if (!isFinite(amount)) return 0;
    
    const rate = exchangeRates[currency] || 1;
    return amount * rate;
  };

  // Formatear monto con símbolo de divisa
  const formatMoney = (amountUSD, decimals = 2) => {
    const converted = convertAmount(amountUSD);
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    return `${symbol}${converted.toFixed(decimals)}`;
  };

  // Formatear monto sin símbolo (solo número)
  const formatAmount = (amountUSD, decimals = 2) => {
    const converted = convertAmount(amountUSD);
    return converted.toFixed(decimals);
  };

  // Obtener símbolo de divisa actual
  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || '$';
  };

  // Obtener nombre de divisa actual
  const getCurrencyName = () => {
    return CURRENCY_NAMES[currency] || 'Dólar (USD)';
  };

  // Inicializar: obtener tasas y detectar ubicación
  useEffect(() => {
    const initializeCurrency = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return;
      }

      const location = await getUserLocation();
      await fetchExchangeRates(location);
    };

    const handleOnline = async () => {
      const location = await getUserLocation();
      await fetchExchangeRates(location);
    };
    
    initializeCurrency();
    
    // Actualizar tasas cada hora
    const interval = setInterval(() => {
      fetchExchangeRates();
    }, 3600000); // 1 hora

    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchExchangeRates, getUserLocation]);

  const value = {
    currency,
    changeCurrency,
    exchangeRates,
    loading,
    convertAmount,
    formatMoney,
    formatAmount,
    getCurrencySymbol,
    getCurrencyName,
    fetchExchangeRates,
    availableCurrencies: Object.keys(CURRENCY_SYMBOLS),
    currencyNames: CURRENCY_NAMES
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
