# Sistema de Conversión de Divisas

## ✨ Funcionalidades Implementadas

### 1. **Selector de Divisas en Panel de Control**
- Ubicación: Panel de Admin → Configuración de Divisas
- Permite cambiar entre: Dólar (USD), Euro (EUR), Libra (GBP)
- La configuración se guarda en localStorage y persiste entre sesiones

### 2. **Detección Automática de Ubicación**
- Al cargar la aplicación, detecta automáticamente el país del usuario mediante su IP
- Sugiere la divisa apropiada según la ubicación:
  - **Europa**: España, Francia, Alemania, Italia, etc. → EUR
  - **Reino Unido**: GB, UK → GBP
  - **Resto del mundo**: USD (por defecto)

### 3. **Tasas de Cambio en Tiempo Real**
- Las tasas se obtienen de la API gratuita: [exchangerate-api.com](https://www.exchangerate-api.com/)
- Se actualizan automáticamente cada hora
- Se almacenan en caché en localStorage para mejor rendimiento
- Botón manual de actualización disponible

### 4. **Conversión Automática**
- Todos los montos en la aplicación se muestran en la divisa seleccionada
- Ejemplos:
  - Balance del usuario en el navbar
  - Montos de transferencias
  - Inversiones
  - Préstamos
  - Retiros y depósitos

## 🔧 Componentes Creados

### `CurrencyContext.js`
Contexto de React que proporciona:
- **currency**: Divisa actual seleccionada
- **changeCurrency(newCurrency)**: Cambiar divisa
- **exchangeRates**: Tasas de cambio actuales
- **formatMoney(amount)**: Formatea monto con símbolo de divisa
- **formatAmount(amount)**: Formatea solo el número sin símbolo
- **getCurrencySymbol()**: Obtiene el símbolo actual ($, €, £)
- **fetchExchangeRates()**: Actualiza tasas manualmente

### `CurrencySelector.js`
Componente visual para:
- Seleccionar divisa preferida
- Ver tasas de cambio actuales
- Actualizar tasas manualmente
- Información sobre detección automática

### `CurrencySelector.css`
Estilos responsivos con:
- Diseño de tarjetas para tasas de cambio
- Destacado visual de divisa activa
- Animaciones suaves
- Adaptación móvil completa

## 📋 Cómo Usar

### Para Administradores
1. Ir a **Panel de Control** (⚙️)
2. Seleccionar **💱 Configuración de Divisas** en el menú lateral
3. Elegir divisa preferida del dropdown
4. Ver tasas de cambio actuales
5. Opcionalmente, actualizar tasas con el botón "↻ Actualizar"

### Para Desarrolladores

#### Usar formatMoney en cualquier componente:
```javascript
import { useContext } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';

function MiComponente() {
  const { formatMoney, getCurrencySymbol } = useContext(CurrencyContext);
  
  return (
    <div>
      <p>Saldo: {formatMoney(1000)}</p>
      {/* Muestra: "Saldo: $1000.00" o "€920.00" o "£790.00" */}
    </div>
  );
}
```

#### Convertir montos sin formato:
```javascript
const { convertAmount } = useContext(CurrencyContext);
const montoConvertido = convertAmount(100); // 100 USD → EUR o GBP
```

## 🌍 APIs Utilizadas

### Exchange Rate API
- **URL**: https://api.exchangerate-api.com/v4/latest/USD
- **Gratuita**: Sí (sin API key necesaria para uso básico)
- **Límites**: ~1500 requests/mes
- **Respuesta**:
```json
{
  "base": "USD",
  "date": "2026-02-26",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    ...
  }
}
```

### IP Geolocation API
- **URL**: https://ipapi.co/json/
- **Gratuita**: Sí (hasta 1000 requests/día)
- **Respuesta incluye**: country_code, city, region, etc.

## 🔄 Flujo de Funcionamiento

1. **Inicialización**:
   - App.js carga CurrencyProvider
   - CurrencyContext verifica localStorage para divisa guardada
   - Si no hay divisa guardada, detecta ubicación del usuario
   - Obtiene tasas de cambio de la API
   - Sugiere divisa según ubicación

2. **Actualización**:
   - Usuario cambia divisa en panel de control
   - Se guarda en localStorage
   - CurrencyContext actualiza estado
   - Todos los componentes que usan useContext(CurrencyContext) se re-renderizan
   - Los montos se muestran con la nueva divisa

3. **Caché**:
   - Tasas se guardan en localStorage con timestamp
   - Si el caché tiene menos de 1 hora, se usa
   - Si el caché es antiguo, se obtienen tasas nuevas
   - Se actualiza cada hora automáticamente

## 📱 Responsividad

El componente es totalmente responsivo:
- **Desktop**: Grid de 3 columnas para tarjetas de divisas
- **Tablet (768px)**: Grid adaptativo
- **Móvil (480px)**: Una columna, botones de ancho completo

## 🚀 Mejoras Futuras

- [ ] Agregar más divisas (JPY, CAD, AUD, etc.)
- [ ] Permitir configuración por usuario (no global)
- [ ] Historial de tasas de cambio
- [ ] Gráficos de evolución de tasas
- [ ] Notificaciones cuando las tasas cambien significativamente
- [ ] API de backup si la principal falla
- [ ] Modo offline con tasas en caché

## ⚠️ Notas Importantes

1. **Todas las transacciones se procesan en USD**: La conversión es solo visual
2. **Las tasas son indicativas**: Para transacciones reales se debe usar la tasa del momento de la transacción
3. **Caché**: Si el navegador borra localStorage, se perderá la preferencia de divisa
4. **API Limits**: No exceder 1500 requests/mes a exchangerate-api.com

## 🧪 Testing

Para probar el sistema:
1. Abrir DevTools → Application → Local Storage
2. Cambiar `selectedCurrency` entre: USD, EUR, GBP
3. Recargar la página
4. Verificar que todos los montos cambien

Para probar tasas de cambio:
1. Ir a Panel de Control → Divisas
2. Hacer clic en "↻ Actualizar"
3. Verificar que las tasas se actualizan en las tarjetas
4. Cambiar divisa y ver que los montos se recalculan

---

**Última actualización**: 26 de febrero de 2026
**Versión**: 1.0.0
**Autor**: GitHub Copilot + Usuario
