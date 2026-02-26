import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CurrencyContext = createContext();

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const CURRENCY_NAMES = {
  USD: 'Dólar (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'Libra (GBP)'
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'USD';
  });
  
  const [exchangeRates, setExchangeRates] = useState(() => {
    const cached = localStorage.getItem('exchangeRates');
    const cacheTime = localStorage.getItem('exchangeRatesTime');
    
    // Si el caché tiene menos de 1 hora, usarlo
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
      return JSON.parse(cached);
    }
    
    return { USD: 1, EUR: 0.92, GBP: 0.79 }; // Valores por defecto
  });
  
  const [loading, setLoading] = useState(false);

  // Función para obtener tasas de cambio actualizadas
  const fetchExchangeRates = useCallback(async (userLocation = null) => {
    setLoading(true);
    try {
      // Usar exchangerate-api.io (gratuita, no requiere API key para uso básico)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) throw new Error('Error al obtener tasas de cambio');
      
      const data = await response.json();
      
      const rates = {
        USD: 1,
        EUR: data.rates.EUR || 0.92,
        GBP: data.rates.GBP || 0.79
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
      console.error('Error al obtener tasas de cambio:', error);
      // Mantener tasas en caché o por defecto
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Detectar divisa según ubicación del usuario
  const detectCurrencyByLocation = (location) => {
    // location puede ser código de país o coordenadas
    const euroCountries = ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'IE', 'FI', 'GR'];
    const gbpCountries = ['GB', 'UK'];
    
    if (typeof location === 'string') {
      const countryCode = location.toUpperCase();
      if (euroCountries.includes(countryCode)) return 'EUR';
      if (gbpCountries.includes(countryCode)) return 'GBP';
    }
    
    return 'USD'; // Por defecto dólar
  };

  // Obtener ubicación del usuario usando API de geolocalización
  const getUserLocation = useCallback(async () => {
    try {
      // Usar ipgeolocation.io o similar (o la API nativa del navegador)
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Error al obtener ubicación');
      
      const data = await response.json();
      return data.country_code; // Devuelve código de país como 'US', 'ES', etc.
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
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

  // Convertir monto de USD a la divisa seleccionada
  const convertAmount = (amountUSD) => {
    const amount = parseFloat(amountUSD);
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
      const location = await getUserLocation();
      await fetchExchangeRates(location);
    };
    
    initializeCurrency();
    
    // Actualizar tasas cada hora
    const interval = setInterval(() => {
      fetchExchangeRates();
    }, 3600000); // 1 hora
    
    return () => clearInterval(interval);
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
