# Solución de Problemas - Error 404 en Rapyd

## 🔴 Problema
Error 404 al intentar acceder a `/recargas/crear-rapyd`

## ✅ Soluciones Aplicadas

### 1. Eliminada Duplicación de Rutas
- **Problema**: El endpoint estaba definido dos veces (en `index.js` y en `recargaRoutes.js`)
- **Solución**: Eliminada la definición duplicada en `index.js`

### 2. Mejor Logging en Frontend
- Agregados logs detallados para ver la URL exacta que se está llamando
- Mejor manejo de errores 404 con mensaje específico

### 3. Endpoints de Debug
- Agregado `/debug/routes` para ver todas las rutas disponibles
- Agregado `/health` para verificar que el servidor está corriendo

## 🧪 Cómo Verificar

### Opción 1: Usar el Script de Verificación

```bash
cd backend
npm run verify
```

Esto verificará todos los endpoints y te dirá cuáles están funcionando.

### Opción 2: Verificación Manual

#### 1. Verificar que el backend esté corriendo
```bash
curl http://localhost:5000/health
```

Deberías ver:
```json
{
  "mensaje": "✓ Banco Exclusivo Backend - Servidor en línea",
  "version": "2.2"
}
```

#### 2. Ver todas las rutas disponibles
```bash
curl http://localhost:5000/debug/routes
```

#### 3. Verificar endpoint de recargas
```bash
curl http://localhost:5000/recargas/debug
```

#### 4. Probar crear-rapyd (requiere autenticación)

Primero obtén un token:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword"}'
```

Luego usa el token para crear una recarga:
```bash
curl -X POST http://localhost:5000/recargas/crear-rapyd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"monto":10}'
```

## 🌐 Problema con Producción (Render)

Si estás usando Render (`be-backend-hfib.onrender.com`):

### Verificar la URL del Backend

1. En el frontend, verifica que la variable de entorno apunte correctamente:
   ```env
   REACT_APP_API_URL=https://be-backend-hfib.onrender.com
   ```

2. Verifica que el backend en Render esté corriendo:
   ```bash
   curl https://be-backend-hfib.onrender.com/health
   ```

3. Si obtienes 404, puede ser que:
   - El backend no se haya desplegado correctamente
   - Las rutas no se montaron correctamente
   - Render necesita reiniciarse

### Reiniciar el Backend en Render

1. Ve al dashboard de Render
2. Selecciona tu servicio `be-backend-hfib`
3. Click en "Manual Deploy" → "Deploy latest commit"
4. Espera a que el despliegue termine
5. Verifica con `curl https://be-backend-hfib.onrender.com/health`

## 🔧 Checklist de Verificación

- [ ] Backend corriendo localmente (`npm run dev`)
- [ ] Endpoint `/health` responde
- [ ] Endpoint `/recargas/debug` responde
- [ ] Variables de entorno de Rapyd configuradas
- [ ] Token de autenticación válido
- [ ] Frontend apunta a la URL correcta
- [ ] En producción: Backend en Render está activo

## 📝 Logs Útiles

### Backend
Cuando llames a `crear-rapyd`, deberías ver en la consola del backend:

```
📡 Rapyd Request: { method: 'POST', path: '/v1/checkouts', baseUrl: '...' }
✅ Rapyd Response: { status: 200, statusMessage: 'SUCCESS' }
✅ Checkout Rapyd creado: { id: '...', redirect_url: '...' }
```

### Frontend
En la consola del navegador deberías ver:

```
📤 Enviando solicitud de pago a: http://localhost:5000/recargas/crear-rapyd
📋 Configuración API_URL: http://localhost:5000
📋 Token presente: true
✅ Respuesta del servidor: { checkoutUrl: '...', checkoutId: '...' }
```

## ❌ Errores Comunes

### Error 404
- **Causa**: Ruta no existe o backend no está corriendo
- **Solución**: Verificar que el backend esté corriendo y las rutas estén montadas

### Error 401 Unauthorized
- **Causa**: Token no válido o no enviado
- **Solución**: Verificar que el token esté en localStorage y sea válido

### Error 500 Internal Server Error
- **Causa**: Error en el servidor (credenciales de Rapyd, error en BD, etc.)
- **Solución**: Ver logs del backend para más detalles

### CORS Error
- **Causa**: Frontend no está en la lista de orígenes permitidos
- **Solución**: Agregar la URL del frontend en el array `allowedOrigins` en `index.js`

## 🚀 Próximos Pasos

1. **Reiniciar el backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verificar endpoints**:
   ```bash
   npm run verify
   ```

3. **Probar en el navegador**:
   - Ir a la página de recargas
   - Abrir consola del navegador (F12)
   - Intentar hacer una recarga
   - Ver los logs en consola

4. **Si todo funciona localmente pero no en producción**:
   - Hacer commit y push de los cambios
   - Redesplegar en Render
   - Esperar unos minutos
   - Probar nuevamente

---

**Última actualización**: Enero 2026
**Cambios**: Eliminada duplicación de rutas, mejorados logs, agregados endpoints de debug
