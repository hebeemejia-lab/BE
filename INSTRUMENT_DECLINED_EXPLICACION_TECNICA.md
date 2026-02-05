# 🔍 INSTRUMENT_DECLINED: Explicación Técnica Detallada

## 📚 ¿Qué Significa "INSTRUMENT_DECLINED"?

### Desglose de la Palabra

```
INSTRUMENT = Instrumento de pago (tarjeta, cuenta bancaria, etc)
DECLINED   = Rechazado / No aprobado
```

**Significado literal**: "El instrumento de pago fue rechazado"

Pero aquí está el punto clave: **El error no dice por qué fue rechazado**. Solo dice que algo falló. Puede ser:
- Fondos insuficientes
- Tarjeta bloqueada
- Datos incorrectos
- **MONTO INCORRECTO O CERO**
- Transacción sospechosa
- Problema con el procesador
- Y más...

---

## 🚨 Tu Problema: Monto 0

Esto es importante. Tu banco dice que **PayPal le envió monto 0**, pero PayPal rechaza con `INSTRUMENT_DECLINED`.

### ¿Por qué sucede esto?

Cuando PayPal envía un monto de **0 a tu banco**, el banco rechaza porque:

1. **No hay transacción válida** - Un monto 0 no es un cobro legítimo
2. **El banco lo interpreta como error** - Rechaza automáticamente
3. **PayPal lo empaсa como INSTRUMENT_DECLINED** - Porque es el código genérico para "el banco rechazó"

```
PayPal envía monto: $0.00
           ↓
Tu banco lo recibe
           ↓
Tu banco rechaza: "No válido"
           ↓
PayPal traduce a: INSTRUMENT_DECLINED
           ↓
Tú ves: "Tu tarjeta fue rechazada"
```

---

## 🔧 ¿Cómo Sucede Monto 0 en el Código?

Hay varias formas en que un monto de 0 puede llegar a PayPal:

### Escenario 1: Validaciones Débiles
```javascript
// ❌ INCORRECTO - Deja pasar 0
const monto = req.body.monto || 0; // Si vacío, asigna 0
if (monto) { // 0 es falsy pero no se rechaza si hay lógica posterior
  // El monto podría ser 0
}
```

### Escenario 2: Conversiones Fallidas
```javascript
// ❌ INCORRECTO
const monto = parseFloat(undefined); // Devuelve NaN
const montoString = NaN.toFixed(2);  // "NaN"
// PayPal lo interpreta como 0

// ❌ INCORRECTO
const monto = parseFloat('');        // Devuelve NaN
const montoString = NaN.toFixed(2);  // "NaN"

// ❌ INCORRECTO
const monto = parseFloat(null);      // Devuelve NaN
```

### Escenario 3: Conversión de Tipos Incorrecta
```javascript
// ❌ INCORRECTO
const monto = Number('abc123');      // NaN
const valor = monto.toFixed(2);      // "NaN"

// ❌ INCORRECTO
const monto = parseInt('1.99');      // 1, perdiendo decimales
```

### Escenario 4: Comisión Inválida
```javascript
// ❌ INCORRECTO
const montoNeto = monto - comision;  // Si comisión > monto = negativo
if (montoNeto <= 0) {
  // Pero aún envía a PayPal!
  paypalService.crearOrden({ monto: montoNeto });
}
```

---

## ✅ Cómo lo Hacemos CORRECTAMENTE

En nuestro código:

```javascript
// Validación en recargaController.js
if (monto === undefined || monto === null || monto === '') {
  return res.status(400).json({ 
    mensaje: 'Monto es requerido',
    error: 'El campo monto no fue proporcionado o está vacío'
  });
}

const montoNumerico = parseFloat(monto);

// Validación de NaN
if (isNaN(montoNumerico) || !isFinite(montoNumerico)) {
  return res.status(400).json({ 
    mensaje: 'Monto inválido',
    error: `El monto "${monto}" no es un número válido`
  });
}

// Validación de rango
if (montoNumerico <= 0) {
  return res.status(400).json({ 
    mensaje: 'Monto debe ser mayor a 0',
    error: `El monto ${montoNumerico} no es válido`
  });
}

if (montoNumerico < 1) {
  return res.status(400).json({ 
    mensaje: 'Monto mínimo es $1 USD',
    error: `El monto ${montoNumerico} es menor al mínimo`
  });
}
```

Luego en paypalService.js:

```javascript
const montoNumerico = parseFloat(Number(monto).toFixed(2));

// Validación
if (isNaN(montoNumerico) || !isFinite(montoNumerico)) {
  throw new Error(`PayPal: Monto inválido: ${monto} -> ${montoNumerico}`);
}

if (montoNumerico <= 0) {
  throw new Error(`PayPal: El monto debe ser > 0. Recibido: ${montoNumerico}`);
}

// Convertir a string correctamente
const montoString = montoNumerico.toFixed(2); // "10.50" no "10.5"

const payload = {
  purchase_units: [{
    amount: {
      currency_code: 'USD',
      value: montoString // SIEMPRE string, nunca número
    }
  }]
};
```

---

## 📊 Comparación: Cómo PayPal Recibe el Monto

| Caso | Qué Enviamos | Qué PayPal Recibe | Resultado |
|------|--------------|-------------------|-----------|
| ✅ **Correcto** | `"10.50"` | $10.50 USD | ✅ Aprobado |
| ❌ **Formato incorrecto** | `10.5` (número) | Rechaza por formato | INSTRUMENT_DECLINED |
| ❌ **Monto 0** | `"0"` o `0.00` | $0.00 USD | INSTRUMENT_DECLINED |
| ❌ **NaN** | `"NaN"` | Rechaza por inválido | INSTRUMENT_DECLINED |
| ❌ **Indefinido** | `undefined` | No envía, error | Error de servidor |
| ❌ **Null** | `null` | Rechaza por nulo | INSTRUMENT_DECLINED |

---

## 🔐 Códigos de Error Relacionados

PayPal usa códigos específicos para monto:

### Para problemas de monto:
```json
{
  "name": "UNPROCESSABLE_ENTITY",
  "message": "The requested action could not be performed",
  "details": [{
    "issue": "AMOUNT_MISMATCH",
    "description": "The amount does not match the order"
  }]
}
```

### Para rechazo de tarjeta:
```json
{
  "name": "UNPROCESSABLE_ENTITY",
  "details": [{
    "issue": "INSTRUMENT_DECLINED",
    "description": "The instrument presented was declined by the processor or bank"
  }]
}
```

### Para monto 0 (específico):
```json
{
  "name": "INVALID_REQUEST_BODY",
  "message": "Invalid request body",
  "details": [{
    "issue": "AMOUNT_MISMATCH",
    "description": "Amount must be greater than 0"
  }]
}
```

---

## 🛡️ Por Qué Este Error es Engañoso

El error `INSTRUMENT_DECLINED` es genérico. PayPal lo usa para:

| Problema Real | Error que devuelve |
|---|---|
| Tarjeta rechazada | `INSTRUMENT_DECLINED` |
| Monto inválido | `INSTRUMENT_DECLINED` |
| Tarjeta expirada | `INSTRUMENT_DECLINED` |
| Fondos insuficientes | `INSTRUMENT_DECLINED` |
| Datos incorrectos | `INSTRUMENT_DECLINED` |
| Error de servidor | `INSTRUMENT_DECLINED` |

Es por eso que debemos:
1. **Validar el monto en frontend**
2. **Validar el monto en backend**
3. **Validar en paypalService**
4. **Loguear todo** para debugging
5. **Enviar detalles al banco/PayPal** para investigación

---

## 🎯 Si Tu Banco Dice "Monto 0"

Significa que **en algún punto** del código, estamos enviando 0 a PayPal.

### Checks que debería hacer:

1. **Verifica recargaController.js** línea 280+
   - ¿El `monto` que viene en `req.body.monto` es válido?
   - ¿Se está calculando `montoNeto` correctamente?

2. **Verifica logs del servidor**
   ```
   🔍 PayPal Service - Monto recibido: [AQUI DEBE VER EL MONTO]
   🔍 PayPal Service - Monto procesado: [AQUI DEBE VER EL MONTO]
   ```

3. **Verifica el payload enviado a PayPal**
   ```json
   {
     "purchase_units": [{
       "amount": {
         "currency_code": "USD",
         "value": "[AQUI DEBE VER '10.50' NO '0']"
       }
     }]
   }
   ```

4. **Si ves monto 0**, el problema está en el cálculo de `montoNeto`:
   ```javascript
   const montoNeto = calcularMontoNeto(montoNumerico, comision);
   // ¿Qué devuelve calcularMontoNeto?
   // ¿Es montoNumerico - comision?
   // ¿Y si comision > montoNumerico, devuelve negativo?
   ```

---

## 💡 Solución Completa de Verificación

Para verificar si estamos enviando monto correcto:

```javascript
// En recargaController.js - Línea que llama a paypalService

console.log('🔍 ANTES DE ENVIAR A PAYPAL:');
console.log('   montoNumerico:', montoNumerico);
console.log('   comision:', comision);
console.log('   montoNeto:', montoNeto);
console.log('   ¿montoNeto > 0?', montoNeto > 0);

// En paypalService.js - Antes de crear payload

console.log('🔍 EN PAYPAL SERVICE:');
console.log('   Monto recibido:', monto);
console.log('   Monto parseado:', montoNumerico);
console.log('   Monto como string:', montoString);
console.log('   ¿Incluye decimales?', montoString.includes('.'));

// Antes de enviar a PayPal

console.log('🔍 PAYLOAD FINAL:');
console.log('   value:', payload.purchase_units[0].amount.value);
console.log('   ¿Es string?', typeof payload.purchase_units[0].amount.value === 'string');
console.log('   ¿No es NaN?', payload.purchase_units[0].amount.value !== 'NaN');
console.log('   ¿Mayor que 0?', parseFloat(payload.purchase_units[0].amount.value) > 0);
```

---

## 📞 Para Tu Banco

Si quieres que tu banco investigue el problema, dile:

> "PayPal me está enviando transacciones con monto $0.00 USD bajo el ID de orden [ORDER_ID]. Rechacen todas las transacciones con monto cero."

Y proporciona:
- Order ID: `4UE422585W3271148` (del error)
- Debug ID: `0534224b43eb5`
- Timestamp: La fecha/hora exacta
- Logs de PayPal/Banco que muestren monto 0

---

## 🔐 Resumen

| Concepto | Explicación |
|----------|------------|
| **INSTRUMENT_DECLINED** | Error genérico: instrumento de pago rechazado (causa desconocida) |
| **MONTO 0** | Causa probable: validación débil permite montos inválidos |
| **Solución** | Validación triple: frontend → backend → paypalService |
| **Logs** | Ver exactamente qué monto se está enviando |
| **PayPal** | Siempre recibe `value` como string: `"10.50"` no `10.5` |
| **Por qué es confuso** | Mismo error para 100 problemas diferentes |

---

**Status**: ✅ Explicación técnica completa  
**Próximas acciones**: Revisar logs del servidor para ver qué monto se envía realmente  
