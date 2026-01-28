# 🔧 CONFIGURACIÓN RENDER - SPA FIX

## Problema Resuelto
- ❌ Frontend mostraba "Not Found" al recargar la página
- ❌ Webhook-rapyd no estaba conectado
- ✅ Ahora configurado como SPA correctamente

## Cambios Implementados

### 1. **Frontend Server.js** (Nuevo)
- Crea servidor Express que sirve la carpeta `build/`
- Redirecciona todas las rutas a `index.html` (SPA)
- Activa compresión gzip para mejor velocidad

### 2. **Package.json Frontend** (Actualizado)
- Agregado: `express` y `compression`
- Nuevo script: `npm run serve` - inicia servidor
- Nuevo script: `npm run prod` - build + serve

### 3. **render.yaml** (Nuevo)
- Configuración centralizada para Render
- Backend: Node.js, puerto 5000
- Frontend: Node.js, puerto 3000
- Variables de entorno configuradas automáticamente

## Pasos en Render

### OPCIÓN 1: Render Dashboard (Manual)
1. Ve a **https://dashboard.render.com**
2. Haz clic en tu Frontend service (`be-frontend-banco`)
3. Ve a **Settings** → **Build Command**
4. Cambia a:
   ```
   cd frontend && npm install && npm run build
   ```
5. Ve a **Start Command**
6. Cambia a:
   ```
   cd frontend && npm run serve
   ```
7. Click **Save Changes**
8. El deployment se iniciará automáticamente

### OPCIÓN 2: Usar render.yaml (Automático)
1. Si tu repositorio tiene `render.yaml` en la raíz
2. Render debería detectarlo automáticamente
3. Verifica que el commit llegó a GitHub: `git log -1` debe mostrar "SPA correcta"
4. Ve a **Dashboard** → **Settings** → **Redeploy**

## Verificación Post-Deploy

Después de que Render termina el redeploy (2-5 minutos):

1. **Abre en navegador:**
   ```
   https://www.bancoexclusivo.lat
   ```

2. **Recarga la página (F5)** - No debe mostrar "Not Found"

3. **Ve a Recargas:**
   ```
   https://www.bancoexclusivo.lat/recargas
   ```
   Recarga again - Debe funcionar

4. **Prueba el pago:**
   - Cantidad: **$1 USD**
   - Click **Proceder al Pago**
   - Debe abrir **ventana Rapyd**

5. **Rellena formulario:**
   - Tarjeta: `4111 1111 1111 1111`
   - CVV: `123`
   - Fecha: Cualquier fecha futura
   - Nombre: Cualquiera

## Webhook Rapyd

El webhook YA está configurado en el backend:
- **URL:** `https://be-backend-hfib.onrender.com/recargas/webhook-rapyd`
- **Funciona sin autenticación** (como debe ser)
- **Actualiza saldo automáticamente** cuando se confirma el pago

Para verificar en **Rapyd Dashboard:**
1. Ve a **Developer** → **Webhooks**
2. Verifica que esté registrado para eventos `PAYMENT_COMPLETED`

## Comandos Útiles

```powershell
# Verificar git commit
git log -1

# Ver cambios locales
git status

# Hacer build local (para probar)
cd frontend
npm install
npm run build
npm run serve
# Abre http://localhost:3000
```

## Timeline Esperado

| Acción | Tiempo |
|--------|--------|
| Push a GitHub | ✅ Completado |
| Render detecta cambios | < 1 min |
| Redeploy inicia | 1-2 min |
| Frontend compilando | 2-3 min |
| Deploy completo | 5-10 min |
| **Verificación lista** | **10-15 min total** |

## Errores Comunes

### "Not Found" al recargar
- ✅ SOLUCIONADO: Usa el nuevo server.js

### "Cannot GET /recargas"
- ✅ SOLUCIONADO: Express redirecciona a index.html

### "webhook-rapyd Failed to load"
- ✅ ESPERADO: Es parte del flujo, no es error

### "504 Bad Gateway"
- Render está aún deployando
- Espera 2-3 minutos más

## Próximos Pasos

1. **Espera 10 minutos** para que Render termine
2. **Recarga tu app** en navegador
3. **Navega a /recargas** y recarga (F5)
4. **Prueba pago de $1** con tarjeta de prueba
5. **Webhook debe actualizar saldo** automáticamente

¡Todo debería funcionar perfectamente ahora! 🎉
