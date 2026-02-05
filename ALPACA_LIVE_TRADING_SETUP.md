# 🚨 Guía de Configuración: Alpaca Live Trading (DINERO REAL)

## ⚠️ ADVERTENCIAS CRÍTICAS

**ESTO ES TRADING REAL CON DINERO REAL. PUEDES PERDER DINERO.**

- Las operaciones ejecutan órdenes REALES en NYSE/NASDAQ
- Las ganancias y pérdidas son REALES
- Requiere cumplir con regulaciones financieras USA (SEC, FINRA)
- Como plataforma, eres legalmente responsable

---

## 📋 Requisitos Obligatorios

### 1. Verificación de Identidad (KYC/AML)

Alpaca requiere verificación completa de identidad según regulaciones USA:

**Información Requerida:**
- ✅ Nombre completo (legal)
- ✅ Fecha de nacimiento
- ✅ SSN (Social Security Number) o ITIN (Tax ID)
- ✅ Dirección física en USA
- ✅ Ciudadanía / Estatus migratorio
- ✅ Información de empleo
- ✅ Experiencia en inversiones

**Documentos a Proporcionar:**
- Identificación con foto (Driver's License, Passport)
- Comprobante de domicilio
- Información bancaria

### 2. Requisitos de Cuenta

**Edad Mínima:** 18 años

**Tipos de Cuenta:**
- **Cash Account** - Solo efectivo, sin margin
- **Margin Account** - Permite margin trading (más riesgoso)

**Mínimo de Capital:**
- Cash Account: $0 (pero recomendado $2,000+)
- Margin Account: $2,000 mínimo por regulación

### 3. Cuenta Bancaria USA

**Requerido para ACH transfers:**
- Banco debe ser USA (ACH compatible)
- Routing number de 9 dígitos
- Account number
- Verificación con microdeposits (3-5 días)

**Bancos NO soportados:**
- Bancos internacionales (fuera de USA)
- Prepaid cards
- Crypto wallets

---

## 🔧 Pasos de Configuración

### Paso 1: Crear Cuenta Alpaca Live

1. **Ir a:** https://app.alpaca.markets/signup
2. Seleccionar: **"Brokerage Account"** (NO paper trading)
3. Completar formulario KYC:
   - Información personal
   - Dirección USA
   - SSN/ITIN
   - Información financiera
   - Experiencia en inversiones

4. **Esperar aprobación:** 1-3 días hábiles
   - Alpaca revisa identidad
   - Verifican documentos
   - Aprueban o rechazan

### Paso 2: Vincular Cuenta Bancaria

1. En dashboard Alpaca → **Funding**
2. **Add Bank Account**
3. Ingresar información:
   - Bank name
   - Routing number
   - Account number
   - Account type (Checking/Savings)

4. **Verificación con microdeposits:**
   - Alpaca envía 2 depósitos pequeños ($0.01-$0.99)
   - Esperar 1-3 días hábiles
   - Confirmar montos exactos en Alpaca

5. ✅ Cuenta verificada y lista para transfers

### Paso 3: Obtener API Keys LIVE

⚠️ **IMPORTANTE: Estas son diferentes de Paper Trading keys**

1. En dashboard Alpaca → **API Keys** (sección Live Trading)
2. Click: **Generate New Key**
3. **Permisos recomendados:**
   - ✅ Account (read)
   - ✅ Trading (read/write)
   - ❌ Money movement (NO - por seguridad)

4. **Copiar y guardar:**
   ```
   API Key ID: AKXXXXXXXXXXXXXXXXXX
   Secret Key: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

5. ⚠️ **Guardar el Secret Key inmediatamente - solo se muestra UNA VEZ**

### Paso 4: Configurar en tu Backend

1. Abrir: `backend/.env`

2. Actualizar credenciales:
```bash
# Alpaca LIVE Trading (DINERO REAL)
ALPACA_API_KEY=AKXXXXXXXXXXXXXXXXXX
ALPACA_SECRET_KEY=tu_secret_key_completo_aqui
ALPACA_BASE_URL=https://api.alpaca.markets
ALPACA_MODE=live
```

3. ✅ Verificar que NO sea paper-api.alpaca.markets

### Paso 5: Transferir Fondos Iniciales

**Opción A: Deposit desde Banco (ACH)**
1. Dashboard Alpaca → Funding → Deposit
2. Seleccionar cuenta bancaria verificada
3. Monto mínimo: $100 (recomendado $2,000+)
4. Esperar: 3-5 días hábiles para clearing
5. ✅ Fondos disponibles para trading

**Opción B: Wire Transfer (más rápido)**
1. Mismo día / siguiente día
2. Comisión: ~$25-35
3. Contactar banco para wire instructions

---

## 🔒 Seguridad y Mejores Prácticas

### Protección de API Keys

```bash
# ✅ HACER:
- Guardar en .env (nunca commit a Git)
- Usar environment variables en producción
- Rotar keys cada 90 días
- Usar permisos mínimos necesarios

# ❌ NO HACER:
- Commit keys a GitHub
- Compartir keys por email/chat
- Usar mismas keys para paper y live
- Dar permisos de "money movement" sin necesidad
```

### Límites de Trading

**Pattern Day Trader (PDT) Rule:**
- Si haces 4+ day trades en 5 días
- Y tu cuenta < $25,000
- → Serás marcado como PDT
- → Restricciones aplicarán

**Límites Recomendados:**
```javascript
// En producción, configurar:
MAX_POSICION_POR_ACCION = 1000 acciones
MAX_COSTO_POR_OPERACION = $10,000
MAX_PERDIDA_DIARIA = $500
```

### Monitoreo y Alertas

**Configurar alertas para:**
- Pérdidas mayores a $X
- Operaciones sospechosas
- Errores de API
- Saldo bajo

---

## 💰 Flujo de Dinero

### Usuario → Alpaca (Funding)

```
Usuario saldo BE: $1,000
  ↓
1. Usuario solicita transfer a trading
  ↓
2. Sistema valida saldo BE
  ↓
3. ACH transfer BE → Alpaca (3-5 días)
  ↓
4. Fondos disponibles en Alpaca
  ↓
Usuario puede comprar acciones REALES
```

### Trading Cycle

```
Alpaca balance: $1,000
  ↓
Compra: 10 AAPL @ $150 = $1,500
  ❌ RECHAZADO - Saldo insuficiente
  
Compra: 5 AAPL @ $150 = $750 ✅
  ↓
Alpaca balance: $250
Posición: 5 AAPL (valor actual)
  ↓
Precio sube a $160
  ↓
Vende: 5 AAPL @ $160 = $800 ✅
  ↓
Alpaca balance: $1,050
Ganancia REAL: $50
```

### Alpaca → Usuario (Withdrawal)

```
Alpaca balance: $1,050
  ↓
1. Usuario solicita retiro a saldo BE
  ↓
2. ACH transfer Alpaca → Banco usuario (3-5 días)
  ↓
3. Confirmar recepción
  ↓
4. Acreditar en saldo BE
  ↓
Usuario saldo BE: $1,050
```

---

## 📊 Costos y Comisiones

### Alpaca (sin comisiones de trading)
- ✅ **$0** - Compra/venta de acciones
- ✅ **$0** - ETFs
- ❌ **NO** - Opciones (no soportado gratis)

### ACH Transfers
- **Deposits:** $0
- **Withdrawals:** $0
- **Tiempo:** 3-5 días hábiles

### Wire Transfers
- **Incoming:** $0-10
- **Outgoing:** $25-35
- **Tiempo:** Mismo día / siguiente día

### Regulatorias (obligatorias)
- **SEC Fee:** $0.0000278 por venta
- **FINRA TAF:** $0.000145 por venta
- **Total:** ~$0.01 por cada $1,000 vendido

---

## ⚖️ Consideraciones Legales

### Responsabilidad de la Plataforma

**Como operador de Banco Exclusivo, eres responsable de:**

1. **KYC/AML Compliance**
   - Verificar identidad de usuarios
   - Reportar actividad sospechosa
   - Mantener registros 5+ años

2. **Disclosure Requirements**
   - Informar riesgos de trading
   - Terms of Service claros
   - Privacy policy actualizada

3. **Customer Funds Protection**
   - Segregar fondos cliente vs empresa
   - SIPC insurance (Alpaca lo cubre)
   - Reconciliación diaria

4. **Reporting**
   - 1099 forms (impuestos USA)
   - Trade confirmations
   - Monthly statements

### Disclaimers Recomendados

**En tu plataforma, incluir:**

```
⚠️ ADVERTENCIA DE RIESGO

El trading de acciones involucra riesgo sustancial de pérdida.
Puedes perder todo o más de tu inversión inicial.

- Rendimiento pasado NO garantiza resultados futuros
- Las inversiones pueden subir o bajar
- No somos asesores financieros
- Consulta con un profesional antes de invertir

Trading NO es apropiado para todos. Solo invierte dinero
que puedas permitirte perder.

Banco Exclusivo actúa como intermediario. Las inversiones
son ejecutadas por Alpaca Securities LLC, miembro FINRA/SIPC.
```

---

## 🧪 Testing en Producción

### Fase 1: Cuenta de Prueba Personal

1. **Tú** creas cuenta Alpaca Live
2. Depositas $100-500 de tu dinero
3. Pruebas todas las funciones
4. Verificas órdenes reales
5. Confirmas retiros funcionan

### Fase 2: Beta Privada

1. Invitar 3-5 usuarios de confianza
2. Límites bajos ($500 máximo)
3. Monitoreo manual de cada operación
4. Feedback y ajustes

### Fase 3: Lanzamiento Público

1. Incrementar límites gradualmente
2. Monitoreo automatizado
3. Alertas de anomalías
4. Soporte 24/7

---

## 🆘 Soporte y Problemas Comunes

### Error: "Account not approved"
**Solución:** Esperar aprobación KYC o contactar Alpaca support

### Error: "Insufficient funds"
**Solución:** Verificar que ACH transfer completó (3-5 días)

### Error: "Trading is disabled"
**Causa:** Pattern Day Trader restriction o cuenta suspendida

### Error: "API key invalid"
**Solución:** Verificar que usas LIVE keys, no paper keys

### Contacto Alpaca Support
- Email: support@alpaca.markets
- Chat: En dashboard Alpaca
- Docs: https://alpaca.markets/docs

---

## 📚 Recursos Adicionales

### Documentación Oficial
- Alpaca Docs: https://alpaca.markets/docs
- API Reference: https://alpaca.markets/docs/api-references
- Trading Guide: https://alpaca.markets/learn

### Regulaciones
- SEC: https://www.sec.gov
- FINRA: https://www.finra.org
- Pattern Day Trader: https://www.finra.org/investors/learn-to-invest/advanced-investing/day-trading-margin-requirements-know-rules

### Comunidad
- Alpaca Slack: https://alpaca.markets/slack
- Forum: https://forum.alpaca.markets
- GitHub: https://github.com/alpacahq

---

## ✅ Checklist Final

Antes de lanzar a producción:

- [ ] Cuenta Alpaca Live aprobada
- [ ] KYC completado y verificado
- [ ] Cuenta bancaria vinculada y verificada
- [ ] API keys LIVE obtenidas y guardadas en .env
- [ ] ALPACA_MODE=live configurado
- [ ] Testing con tu propio dinero completado
- [ ] Disclaimers legales agregados al frontend
- [ ] Terms of Service actualizados
- [ ] Privacy Policy actualizado
- [ ] Sistema de alertas configurado
- [ ] Límites de seguridad implementados
- [ ] Monitoreo en tiempo real activo
- [ ] Proceso de retiros probado
- [ ] Soporte al cliente preparado

---

## 🚀 Conclusión

Trading real es complejo y requiere preparación seria. No subestimes:
- Responsabilidad legal
- Riesgos financieros
- Complejidad regulatoria
- Soporte al cliente

**Recomendación:** Comienza con Paper Trading hasta dominar todo el flujo, luego migra a Live con límites muy conservadores.

**¿Preguntas?** Consulta con:
- Abogado especializado en securities
- Contador con experiencia en brokerage
- Alpaca support team
