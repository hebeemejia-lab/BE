# 💰 Montos Mínimos en PayPal - Guía Completa

## La Pregunta
> ¿De cuánto es el mínimo para que PayPal mande un monto visible?

## La Respuesta Rápida

| Proveedor | Mínimo | Nuestro Límite |
|---|---|---|
| **PayPal** | **$0.01 USD** | $1.00 USD |
| **Stripe** | $0.50 USD | $1.00 USD |
| **MercadoPago** | $0.50 USD | $1.00 USD |

**Nuestro sistema rechaza transacciones menores a $1.00 USD** para mantener márgenes de ganancia (comisión).

---

## 🔍 Desglose Técnico

### PayPal - Mínimo Oficial

PayPal requiere un mínimo de **$0.01 USD** (1 centavo).

**Por qué?**
- Transacciones tan pequeñas existen (microsegundos, bits, tokens)
- PayPal es usado por plataformas para pagos muy pequeños
- Tecnicamente soporta hasta 2 decimales: $0.01, $0.02, etc.

**En nuestro código:**
```javascript
// paypalService.js - línea 69
if (montoNumerico < 0.01) {
  throw new Error(`PayPal: El monto mínimo es $0.01 USD`);
}
```

---

### Nuestro Sistema - Mínimo Configurado

Rechazamos transacciones menores a **$1.00 USD**.

**Por qué?**
```
Recarga de $0.50:
- Comisión PayPal: $0.99
- Montonet = $0.50 - $0.99 = -$0.49

❌ No vale la pena procesar
```

**En nuestro código:**
```javascript
// recargaController.js - línea 299
if (montoNumerico < 1) {
  return res.status(400).json({ 
    mensaje: 'Monto mínimo es $1 USD',
    error: `El monto ${montoNumerico} es menor al mínimo permitido de $1 USD`
  });
}
```

---

## 📊 Tabla: Qué Sucede con Diferentes Montos

| Monto | Comisión | Neto | Estado | Nota |
|---|---|---|---|---|
| $0.01 | $0.99 | -$0.98 | ❌ Rechazado | Menor a $1 |
| $0.50 | $0.99 | -$0.49 | ❌ Rechazado | Menor a $1 |
| $0.99 | $0.99 | $0.00 | ❌ Rechazado | Neto = 0 |
| $1.00 | $0.99 | $0.01 | ✅ Aceptado | Primer monto válido |
| $1.99 | $0.99 | $1.00 | ✅ Aceptado | Usuario recibe $1 |
| $2.00 | $0.99 | $1.01 | ✅ Aceptado | Usuario recibe $1.01 |
| $10.00 | $0.99 | $9.01 | ✅ Aceptado | Usuario recibe $9.01 |
| $100.00 | $0.99 | $99.01 | ✅ Aceptado | Usuario recibe $99.01 |

---

## 🎯 Lo Que Sucede Internamente

### Con Monto $0.50

```
FRONTEND (usuario ingresa)
    ↓ monto: $0.50
    ↓
BACKEND - recargaController.js
    ↓ Validación: ¿0.50 < 1?
    ✅ SÍ
    ↓ RECHAZA
    ❌ "Monto mínimo es $1 USD"
```

### Con Monto $1.00

```
FRONTEND (usuario ingresa)
    ↓ monto: $1.00
    ↓
BACKEND - recargaController.js
    ↓ Validación: ¿1.00 < 1?
    ✅ NO
    ↓ Calcula: comisión = $0.99
    ↓ Calcula: neto = $1.00 - $0.99 = $0.01
    ↓ Validación: ¿neto > 0?
    ✅ SÍ ($0.01 > 0)
    ↓
PAYPAL SERVICE
    ↓ Validación: ¿monto < 0.01?
    ✅ NO ($1.00 > 0.01)
    ↓ ENVÍA A PAYPAL
    ✅ "value": "1.00"
```

---

## 💡 Por Qué Estos Límites

### PayPal $0.01
- Es el mínimo técnico de PayPal
- Permite transacciones de fracciones de centavo
- Usado para micropagos

### Nuestro $1.00
- La comisión PayPal es $0.99 (o varía según configuración)
- Con $1.00 de entrada, el usuario recibe $0.01 (no vale la pena)
- Con $1.99 de entrada, el usuario recibe $1.00 (primer valor útil)

### Fórmula
```
Usuario recibe = Monto - Comisión
Usuario recibe = X - $0.99

Para que usuario reciba al menos $1.00:
X - 0.99 >= 1.00
X >= 1.99

PERO aceptamos desde $1.00 porque:
1.00 - 0.99 = 0.01 (técnicamente válido)
```

---

## 🔧 Configuración Actual

### Variables de Entorno (no configuradas, usa hardcoded)

Podrían agregarse para mayor flexibilidad:

```env
# Montos Mínimos
PAYPAL_MONTO_MINIMO=0.01        # Límite de PayPal
SISTEMA_MONTO_MINIMO=1.00       # Límite de nuestro sistema
USUARIO_RECIBE_MINIMO=0.01      # Mínimo que usuario recibe

# Comisiones
RECARGA_COMISION_FIJA=0.99      # Ya existe
```

---

## 🚨 Límites Máximos

PayPal también tiene límites máximos:

| Tipo de Cuenta | Máximo |
|---|---|
| Cuenta Personal | $2,000 USD/transacción |
| Cuenta Comercial | $10,000 USD/transacción |
| Enterprise | Sin límite (requiere negociación) |

**Nuestro código**: No implementa límite máximo (debería hacerse)

---

## 📱 Comportamiento en Frontend

### Validación en React

Debería validar:
```javascript
const MONTO_MINIMO = 1.00;
const MONTO_MAXIMO = 10000.00;

if (monto < MONTO_MINIMO) {
  setError('Monto mínimo es $1.00 USD');
}

if (monto > MONTO_MAXIMO) {
  setError('Monto máximo es $10,000.00 USD');
}
```

---

## ✅ Flujo Actual vs. Mejorado

### Actual ✅
```
$0.50 → Rechaza en backend → Error en UI → Usuario entiende
$1.00 → Envía a PayPal → PayPal acepta → Éxito
```

### Mejorado (con límites en frontend)
```
$0.50 → Rechaza en frontend (sin request) → Mejor UX
$1.00 → Envía a PayPal → PayPal acepta → Éxito
$15000 → Rechaza en frontend → Error claro
```

---

## 🔐 Validación Triple

1. **Frontend (React)**
   - ¿Monto >= $1.00?
   - ¿Monto <= $10,000?

2. **Backend (Express)**
   - ¿Monto >= $1.00?
   - ¿MontoNeto > 0?

3. **PayPal Service**
   - ¿Monto >= $0.01?
   - ¿Monto != "0.00"?
   - ¿Monto != "NaN"?

---

## 📞 Respuesta Técnica Correcta

**Si alguien te pregunta:**
> "¿Cuál es el mínimo para PayPal?"

**Responde:**
- PayPal técnicamente acepta desde **$0.01 USD**
- Nuestro sistema rechaza menores a **$1.00 USD** (por márgenes de comisión)
- El usuario verá error si intenta montos menores a $1.00

**Si preguntan por qué:**
- La comisión PayPal es $0.99
- Con $1.00 de entrada, usuario solo recibe $0.01
- Es antieconómico procesar

---

## 🎯 Resumen

| Concepto | Valor |
|---|---|
| **PayPal mínimo técnico** | $0.01 USD |
| **Nuestro mínimo de negocio** | $1.00 USD |
| **Usuario recibe mínimo** | $0.01 USD (con entrada $1.00) |
| **Usuario recibe útil** | $1.00 USD (con entrada $1.99) |
| **PayPal máximo** | $2,000-$10,000 (según cuenta) |

---

**Estado**: ✅ Documentación completa  
**Última actualización**: Febrero 2026
