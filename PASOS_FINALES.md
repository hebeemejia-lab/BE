# ✅ PASOS FINALES PARA ACTIVAR RAPYD

## 📝 Resumen de lo que se hizo:

✅ Código de Rapyd implementado completamente  
✅ Endpoints configurados (`/recargas/crear-rapyd` y `/recargas/webhook-rapyd`)  
✅ Cambios pusheados a GitHub  
✅ Frontend actualizado para manejar redirecciones de pago  
✅ Scripts de testing creados  

---

## 🔴 QUÉ TIENES QUE HACER AHORA:

### PASO 1️⃣: Agregar Variables de Entorno en Render

**URL:** https://dashboard.render.com/

1. Ve a tu servicio **be-backend-hfib**
2. Click en **Settings** → **Environment**
3. Agrega estas 4 variables exactamente:

```
RAPYD_ACCESS_KEY = [Tu Access Key de Rapyd]
RAPYD_SECRET_KEY = [Tu Secret Key de Rapyd]
RAPYD_BASE_URL = https://sandboxapi.rapyd.net
FRONTEND_URL = [Tu URL frontend, ej: https://www.bancoexclusivo.lat]
```

**¿Dónde obtener las claves?**
- Ve a: https://dashboard.rapyd.net/ → Developers → API Keys
- Copia el Access Key y Secret Key

**Importante:** Usa las credenciales de **Sandbox** para testing

---

### PASO 2️⃣: Desplegar en Render

1. Ve al dashboard de Render
2. Selecciona **be-backend-hfib**
3. Click en **Manual Deploy** → **Deploy latest commit**
4. Espera 2-5 minutos a que termine

---

### PASO 3️⃣: Configurar Webhook en Rapyd

**URL:** https://dashboard.rapyd.net/

1. Ve a **Developers** → **Webhooks**
2. Click en **Add Webhook**
3. En **URL** ingresa:
   ```
   https://be-backend-hfib.onrender.com/recargas/webhook-rapyd
   ```
4. Selecciona estos eventos:
   - ✅ PAYMENT_COMPLETED
   - ✅ CHECKOUT_COMPLETED
   - ✅ PAYMENT_FAILED
   - ✅ CHECKOUT_PAYMENT_FAILURE
5. Click en **Create**

---

### PASO 4️⃣: Verificar que Funciona

#### Test 1: Backend en línea
Abre en tu navegador:
```
https://be-backend-hfib.onrender.com/health
```

Deberías ver algo como:
```json
{
  "mensaje": "✓ Banco Exclusivo Backend - Servidor en línea",
  "version": "2.2"
}
```

#### Test 2: Probar Pago Real
1. Abre tu aplicación: https://tu-dominio-frontend.com
2. Ve a la página de **Recargas**
3. Selecciona la pestaña de **Tarjeta de Crédito/Débito**
4. Ingresa **$1 USD** como monto
5. Click en **Proceder al Pago**
6. Deberías ser redirigido a la ventana de Rapyd
7. Usa esta tarjeta de prueba:
   - **Número:** 4111 1111 1111 1111
   - **CVV:** 123
   - **Fecha:** Cualquier mes/año futuro
8. Completa el pago
9. Deberías volver a tu aplicación con un mensaje de éxito

---

## 🎯 ¿Qué Esperar?

**Flujo Completo:**
1. Usuario ingresa monto en la app
2. Click en "Proceder al Pago"
3. Se abre ventana de Rapyd con formulario seguro
4. Usuario ingresa datos de tarjeta
5. Rapyd procesa el pago
6. Usuario es redirigido a tu app con confirmación
7. Backend recibe webhook de Rapyd
8. Saldo del usuario se actualiza automáticamente

---

## ⚠️ TROUBLESHOOTING

### "Error 404: El endpoint no existe"
- Verifica que el despliegue en Render haya completado
- Abre `/health` para verificar que el backend está en línea

### "Credenciales de Rapyd no configuradas"
- Verifica que las variables de entorno estén en Render
- Usa exactamente estos nombres: `RAPYD_ACCESS_KEY`, `RAPYD_SECRET_KEY`
- Sin espacios al inicio o final

### "El saldo no se actualiza después del pago"
- Verifica que el webhook esté configurado en Rapyd
- El webhook debe estar en: `/recargas/webhook-rapyd`

### El formulario de pago no aparece
- Abre la consola del navegador (F12)
- Verifica que no haya errores CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente

---

## 📊 Estado Actual

| Componente | Estado |
|-----------|--------|
| Backend en Render | ✅ Código listo |
| Frontend | ✅ Código listo |
| Variables de entorno | ⏳ Pendiente (PASO 1) |
| Despliegue | ⏳ Pendiente (PASO 2) |
| Webhook | ⏳ Pendiente (PASO 3) |
| Testing | ⏳ Pendiente (PASO 4) |

---

## 💡 Información Útil

### Variables de Entorno Configuradas Correctamente:
```
✅ RAPYD_ACCESS_KEY = abc123... (de Rapyd)
✅ RAPYD_SECRET_KEY = xyz789... (de Rapyd)
✅ RAPYD_BASE_URL = https://sandboxapi.rapyd.net
✅ FRONTEND_URL = https://www.bancoexclusivo.lat (tu dominio)
```

### Endpoints Disponibles:
- `POST /recargas/crear-rapyd` → Crear pago
- `POST /recargas/webhook-rapyd` → Recibir confirmación
- `GET /health` → Verificar servidor
- `GET /debug/routes` → Ver todas las rutas

### Archivos Modificados:
- backend/src/services/rapydService.js
- backend/src/controllers/recargaController.js
- backend/src/routes/recargaRoutes.js
- frontend/src/pages/Recargas.js
- frontend/src/pages/RecargasNew.js

---

## 🎉 ¡Eso es todo!

Una vez completes los 4 pasos, la ventana de pago debería funcionar.

**Tiempo estimado:** 10-15 minutos

---

**Última actualización:** Enero 2026  
**Versión:** 2.2
