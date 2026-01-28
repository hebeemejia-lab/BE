# 🚀 CHECKLIST DE IMPLEMENTACIÓN - VENTANA DE PAGO RAPYD

## ✅ YA COMPLETADO (Backend)

- [x] Endpoint `/recargas/crear-rapyd` implementado
- [x] Webhook `/recargas/webhook-rapyd` implementado
- [x] Servicio de Rapyd configurado
- [x] Modelo de Recarga actualizado
- [x] Rutas de Rapyd configuradas
- [x] Frontend actualizado para redirecciones
- [x] Scripts de testing creados
- [x] Documentación completa
- [x] Código pusheado a GitHub

---

## ⏳ PASOS QUE DEBES HACER AHORA (15 minutos)

### 1️⃣ CONFIGURAR VARIABLES EN RENDER (3 min)

**URL:** https://dashboard.render.com/

- [ ] Abrir Dashboard de Render
- [ ] Ir a servicio **be-backend-hfib**
- [ ] Click en **Settings** → **Environment**
- [ ] Agregar `RAPYD_ACCESS_KEY` (obtener de https://dashboard.rapyd.net/)
- [ ] Agregar `RAPYD_SECRET_KEY` (obtener de https://dashboard.rapyd.net/)
- [ ] Agregar `RAPYD_BASE_URL = https://sandboxapi.rapyd.net`
- [ ] Agregar `FRONTEND_URL = [Tu URL]`
- [ ] Guardar cambios

**Credenciales de Rapyd:**
```
De: https://dashboard.rapyd.net/ → Developers → API Keys
```

---

### 2️⃣ DESPLEGAR EN RENDER (5 min)

- [ ] En Render, ir a **be-backend-hfib**
- [ ] Click en **Manual Deploy**
- [ ] Click en **Deploy latest commit**
- [ ] Esperar mensaje "Deployed" (verde)
- [ ] ✅ Backend actualizado

---

### 3️⃣ CONFIGURAR WEBHOOK EN RAPYD (3 min)

**URL:** https://dashboard.rapyd.net/

- [ ] Ir a **Developers** → **Webhooks**
- [ ] Click en **Add Webhook**
- [ ] En **URL** copiar:
  ```
  https://be-backend-hfib.onrender.com/recargas/webhook-rapyd
  ```
- [ ] Seleccionar eventos:
  - [ ] PAYMENT_COMPLETED
  - [ ] CHECKOUT_COMPLETED
  - [ ] PAYMENT_FAILED
  - [ ] CHECKOUT_PAYMENT_FAILURE
- [ ] Click en **Create**
- [ ] ✅ Webhook configurado

---

### 4️⃣ TESTING (4 min)

#### Verificación 1: Backend Online
- [ ] Abrir: `https://be-backend-hfib.onrender.com/health`
- [ ] Debe mostrar JSON con "Servidor en línea"

#### Verificación 2: Frontend Conectado
- [ ] Abrir tu aplicación
- [ ] Consola del navegador (F12) sin errores
- [ ] Puede acceder a página de Recargas

#### Verificación 3: Pago de Prueba
- [ ] En Recargas, pestaña "Tarjeta de Crédito/Débito"
- [ ] Ingresar monto: **1** USD
- [ ] Click en **Proceder al Pago**
- [ ] Se abre ventana de Rapyd
- [ ] Usar tarjeta de prueba:
  - Número: `4111 1111 1111 1111`
  - CVV: `123`
  - Fecha: Futuro
- [ ] Completar pago
- [ ] Volver a tu app con confirmación
- [ ] ✅ ¡FUNCIONA!

---

## 📋 INFORMACIÓN IMPORTANTE

### Credenciales a Usar:

**Para TESTING (Sandbox):**
```
RAPYD_ACCESS_KEY = [De Rapyd → Sandbox]
RAPYD_SECRET_KEY = [De Rapyd → Sandbox]
RAPYD_BASE_URL = https://sandboxapi.rapyd.net
```

**Para PRODUCCIÓN (Cuando esté listo):**
```
RAPYD_BASE_URL = https://api.rapyd.net
```

### URLs Clave:

| Recurso | URL |
|---------|-----|
| Dashboard Rapyd | https://dashboard.rapyd.net/ |
| Render Deploy | https://dashboard.render.com/ |
| Backend Health | https://be-backend-hfib.onrender.com/health |
| Frontend | https://tu-dominio-frontend.com |

---

## 🔍 VERIFICACIÓN RÁPIDA

Después de desplegar, ejecuta en tu navegador:

1. Abre la consola (F12)
2. Copia en la consola:
```javascript
fetch('https://be-backend-hfib.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

Deberías ver:
```javascript
{
  mensaje: "✓ Banco Exclusivo Backend - Servidor en línea",
  version: "2.2"
}
```

---

## ❌ SI ALGO FALLA

### Error 404
**Solución:** El despliegue en Render no completó. Espera e intenta de nuevo.

### Error "Credenciales no configuradas"
**Solución:** Falta agregar variables en Render. Verifica que todas 4 estén ahí.

### El pago no redirige
**Solución:** 
1. Abre consola (F12)
2. Verifica que no haya errores
3. Verifica que `FRONTEND_URL` sea correcto

### El saldo no se actualiza
**Solución:** Configura el webhook en Rapyd (paso 3)

---

## 📞 SOPORTE

Si necesitas ayuda:
1. Revisa los logs en Render (servicio → Logs)
2. Abre consola del navegador (F12)
3. Verifica variables de entorno en Render

---

## ✨ RESUMEN

**Antes:**
- Ventana de pago no funcionaba
- 404 en endpoint de Rapyd

**Ahora:**
- Todo implementado ✅
- Solo necesitas agregar credenciales
- Desplegar una vez
- ¡Listo!

**Tiempo total:** ~15 minutos

---

**¿Listo para empezar?** → Ve a https://dashboard.render.com/

---

Última actualización: Enero 2026
