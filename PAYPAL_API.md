# PayPal API (Checkout) – Guía rápida

## ✅ Objetivo
Procesar **recargas PayPal** en producción usando el flujo **Crear Orden → Aprobar → Capturar**.

## 🔑 Variables de entorno requeridas (Render y local)
```
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=TU_CLIENT_ID
PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET
# (Opcional) PAYPAL_BASE_URL=https://api-m.paypal.com
```
> **Nota:** si `PAYPAL_MODE=live`, no necesitas `PAYPAL_BASE_URL`.

## 🌐 Flujo completo
1. **Crear orden PayPal** (backend)
2. **Redirección del usuario** al checkout de PayPal
3. **PayPal devuelve** al `return_url` con `success=true&recargaId=...`
4. **Capturar pago** (backend)
5. **Actualizar saldo** del usuario

## ✅ Endpoints principales
### Crear orden
**POST** `/recargas/crear-paypal`
- Requiere JWT
- Body:
```
{ "monto": 10 }
```
- Respuesta:
```
{ "checkoutUrl": "https://www.paypal.com/checkoutnow?token=...", "recargaId": 123 }
```

### Capturar orden
**POST** `/recargas/paypal/capturar`
- **Sin JWT** (PayPal redirige sin token)
- Body:
```
{ "recargaId": 123 }
```
- Respuesta:
```
{ "mensaje": "Pago PayPal completado exitosamente", "recargaId": 123 }
```

## 🔁 URLs de retorno
Configuradas en backend:
```
return_url = https://www.bancoexclusivo.lat/recargas?success=true&recargaId=ID
cancel_url = https://www.bancoexclusivo.lat/recargas?error=cancelled
```

## ⚠️ Errores comunes
### `INSTRUMENT_DECLINED`
La tarjeta fue rechazada por el banco o el procesador. No es error del código.

### `recargaId inválido`
El frontend no recibió bien el parámetro o llegó vacío.

### `Recarga sin paypalOrderId`
La orden no se creó correctamente antes de capturar.

## ✅ Checklist de verificación
- [ ] `PAYPAL_MODE=live` en Render
- [ ] `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` configurados en Render
- [ ] Endpoint `/recargas/crear-paypal` responde con `checkoutUrl`
- [ ] Redirect vuelve con `recargaId`
- [ ] `/recargas/paypal/capturar` no requiere JWT
- [ ] Saldo actualizado en DB

---
Si quieres que lo amplíe con webhooks, contabilidad o reportes, dime y lo agrego.
