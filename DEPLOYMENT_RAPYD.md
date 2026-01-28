# 🚀 Guía de Deployment - Rapyd en Render

## PASO 1: Variables de Entorno en Render

Necesitas agregar 4 variables en tu servicio `be-backend-hfib` en Render.

### Instrucciones:

1. Ve a: **Dashboard Render** → **be-backend-hfib** (tu servicio)
2. Click en **Environment**
3. Agrega estas variables:

```
RAPYD_ACCESS_KEY = [Tu Access Key de Rapyd]
RAPYD_SECRET_KEY = [Tu Secret Key de Rapyd]  
RAPYD_BASE_URL = https://sandboxapi.rapyd.net
FRONTEND_URL = https://tu-frontend-url.com
```

### ¿Dónde obtener las credenciales de Rapyd?

1. Ve a https://dashboard.rapyd.net/
2. Login a tu cuenta
3. Ve a **Developers** → **API Keys**
4. Copia:
   - **Access Key** → Variable `RAPYD_ACCESS_KEY`
   - **Secret Key** → Variable `RAPYD_SECRET_KEY`

### IMPORTANTE:

- Para **SANDBOX** (testing): Usa las credenciales de "Sandbox"
- Para **PRODUCCIÓN**: Usa las credenciales de "Production"
- No dejes espacios en las credenciales

---

## PASO 2: Verificar URL del Frontend

En tu archivo `.env` del frontend, asegúrate que tenga:

```env
REACT_APP_API_URL=https://be-backend-hfib.onrender.com
```

---

## PASO 3: Desplegar en Render

Después de agregar las variables:

1. Ve a tu servicio en Render
2. Click en **Manual Deploy**
3. Click en **Deploy latest commit**
4. Espera 2-5 minutos a que termine el despliegue

Verás un mensaje como:
```
✓ Build successful
✓ Deployed
```

---

## PASO 4: Verificar que Funciona

### Test 1: Health Check
Abre en tu navegador:
```
https://be-backend-hfib.onrender.com/health
```

Deberías ver:
```json
{
  "mensaje": "✓ Banco Exclusivo Backend - Servidor en línea",
  "version": "2.2"
}
```

### Test 2: Ver Rutas
```
https://be-backend-hfib.onrender.com/debug/routes
```

### Test 3: Probar Pago

1. Abre tu aplicación en el navegador
2. Ve a la página de **Recargas**
3. Ingresa un monto (ej: 10 USD)
4. Click en **Proceder al Pago**
5. Deberías ser redirigido a la ventana de pago de Rapyd

---

## PASO 5: Configurar Webhook en Rapyd (Importante)

Para recibir confirmaciones de pago:

1. Ve a https://dashboard.rapyd.net/
2. Ve a **Developers** → **Webhooks**
3. Click en **Add Webhook**
4. URL: `https://be-backend-hfib.onrender.com/recargas/webhook-rapyd`
5. Selecciona eventos:
   - ✅ PAYMENT_COMPLETED
   - ✅ CHECKOUT_COMPLETED
   - ✅ PAYMENT_FAILED
   - ✅ CHECKOUT_PAYMENT_FAILURE
6. Click en **Create**

---

## ⚠️ Solución de Problemas

### Error 404 en Rapyd
**Causa:** Las variables de entorno no están configuradas  
**Solución:** Verifica que las variables estén en Render sin espacios

### Error "Credenciales de Rapyd no configuradas"
**Causa:** Falta alguna variable de entorno  
**Solución:** Agrega todas las 4 variables: `RAPYD_ACCESS_KEY`, `RAPYD_SECRET_KEY`, `RAPYD_BASE_URL`, `FRONTEND_URL`

### Error "Invalid signature"
**Causa:** La `RAPYD_SECRET_KEY` es incorrecta  
**Solución:** Copia exactamente desde el portal de Rapyd, sin espacios

### El saldo no se actualiza después del pago
**Causa:** El webhook no está configurado  
**Solución:** Configura el webhook en el Panel de Rapyd (Paso 5 arriba)

---

## 🧪 Tarjetas de Prueba (Sandbox)

Para probar sin dinero real:

**Tarjeta EXITOSA:**
- Número: 4111 1111 1111 1111
- CVV: 123
- Fecha: Cualquier fecha futura

**Tarjeta RECHAZADA:**
- Número: 4000 0000 0000 0002
- CVV: 123
- Fecha: Cualquier fecha futura

---

## 📋 Checklist Final

- [ ] ✅ Variables de entorno agregadas en Render
- [ ] ✅ Código desplegado (git push completado)
- [ ] ✅ Despliegue en Render completado
- [ ] ✅ `/health` responde correctamente
- [ ] ✅ Webhook configurado en Rapyd
- [ ] ✅ Frontend apunta a URL correcta
- [ ] ✅ Probado con tarjeta de prueba

---

## 🎉 ¡Listo!

Si todo está configurado correctamente, la ventana de pago debería funcionar. 

**Próximo paso:** Ve a tu aplicación y prueba hacer una recarga de $1 USD con la tarjeta de prueba.

---

**Última actualización:** Enero 2026  
**Versión:** 2.2
