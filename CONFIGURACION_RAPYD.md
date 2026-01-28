# Configuración de Rapyd - Guía Completa

## 🔧 Problemas Resueltos

Se corrigieron los siguientes problemas en la integración de Rapyd:

1. ✅ **Validación de credenciales**: Ahora verifica que las API keys estén configuradas
2. ✅ **URLs de redirección mejoradas**: Agregado `cancel_url` y `error_url`
3. ✅ **Webhook implementado**: Endpoint para recibir confirmaciones de pago
4. ✅ **Mejor manejo de errores**: Logs detallados y mensajes de error claros
5. ✅ **Corrección de campos API**: Usando `redirect_url` en lugar de `checkout_url`
6. ✅ **Timeout agregado**: 30 segundos para prevenir conexiones colgadas

## 📝 Configuración Requerida

### 1. Variables de Entorno

Agregar en tu archivo `.env`:

```env
# Rapyd Configuration
RAPYD_ACCESS_KEY=tu_access_key_aqui
RAPYD_SECRET_KEY=tu_secret_key_aqui
RAPYD_BASE_URL=https://sandboxapi.rapyd.net  # Para producción: https://api.rapyd.net

# Frontend URL (importante para redirecciones)
FRONTEND_URL=http://localhost:3000  # O tu dominio en producción
```

### 2. Obtener Credenciales de Rapyd

1. Crear cuenta en [Rapyd Client Portal](https://dashboard.rapyd.net/)
2. Ir a **Developers** > **API Keys**
3. Copiar el `Access Key` y `Secret Key`
4. Para testing, usar las credenciales de **Sandbox**
5. Para producción, usar las credenciales de **Production**

### 3. Configurar Webhook en Rapyd

En el portal de Rapyd:

1. Ir a **Developers** > **Webhooks**
2. Crear un nuevo webhook con esta URL:
   ```
   https://tu-dominio.com/api/recargas/webhook-rapyd
   ```
3. Seleccionar estos eventos:
   - `PAYMENT_COMPLETED`
   - `CHECKOUT_COMPLETED`
   - `PAYMENT_FAILED`
   - `CHECKOUT_PAYMENT_FAILURE`
4. Guardar y copiar el **Webhook Secret** (opcional, para verificar firmas)

## 🚀 Uso del Endpoint

### Crear recarga con Rapyd

```javascript
// Frontend - ejemplo con Axios
const response = await axios.post('/api/recargas/crear-rapyd', 
  { monto: 100 },
  { headers: { Authorization: `Bearer ${token}` } }
);

// Redirigir al usuario a la ventana de pago
window.location.href = response.data.checkoutUrl;
```

### Respuesta del servidor

```json
{
  "mensaje": "Pago Rapyd creado exitosamente",
  "checkoutUrl": "https://sandboxcheckout.rapyd.net/...",
  "checkoutId": "checkout_abc123",
  "recargaId": 42,
  "monto": 100,
  "numeroReferencia": "REC-1234567890"
}
```

## 🔍 Verificar Configuración

### 1. Test de Credenciales

```bash
# En el backend
curl -X POST http://localhost:5000/api/recargas/crear-rapyd \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monto": 1}'
```

### 2. Ver Logs

Los logs ahora incluyen información detallada:

```
🔐 Generando firma Rapyd: { method: 'POST', path: '/v1/checkouts', timestamp: '...' }
📡 Rapyd Request: { method: 'POST', path: '/v1/checkouts', baseUrl: 'https://sandboxapi.rapyd.net' }
✅ Rapyd Response: { status: 200, statusMessage: 'SUCCESS' }
✅ Checkout Rapyd creado: { id: '...', redirect_url: '...', status: 'NEW' }
```

### 3. Errores Comunes y Soluciones

#### Error: "Credenciales de Rapyd no configuradas"
- **Causa**: Variables `RAPYD_ACCESS_KEY` o `RAPYD_SECRET_KEY` no están en `.env`
- **Solución**: Agregar las credenciales en el archivo `.env`

#### Error: "Invalid signature"
- **Causa**: Secret Key incorrecta o formato de firma incorrecto
- **Solución**: Verificar que el `RAPYD_SECRET_KEY` sea correcto y no tenga espacios

#### Error: "Rapyd no proporcionó URL de checkout"
- **Causa**: Respuesta de Rapyd sin el campo `redirect_url`
- **Solución**: Verificar que las credenciales sean válidas y el endpoint sea correcto

#### Error: "Currency not supported"
- **Causa**: La moneda no está soportada en tu configuración de Rapyd
- **Solución**: Verificar en el portal de Rapyd qué monedas están habilitadas

## 🧪 Probar con Tarjetas de Test (Sandbox)

Rapyd proporciona tarjetas de prueba:

```
Tarjeta exitosa:
Número: 4111 1111 1111 1111
CVV: 123
Fecha: Cualquier fecha futura

Tarjeta rechazada:
Número: 4000 0000 0000 0002
CVV: 123
Fecha: Cualquier fecha futura
```

## 📊 Flujo Completo

1. **Usuario solicita recarga** → Frontend envía monto al backend
2. **Backend crea checkout** → Llama a Rapyd API y obtiene URL de pago
3. **Usuario redirigido** → Frontend redirige a la ventana de pago de Rapyd
4. **Usuario paga** → Completa el pago en la ventana de Rapyd
5. **Rapyd notifica** → Envía webhook al backend
6. **Backend procesa** → Actualiza estado de recarga y saldo del usuario
7. **Usuario redirigido** → Vuelve al frontend con confirmación

## 🔒 Seguridad

- ✅ Validación de firmas HMAC en todas las requests
- ✅ Webhook debe verificar la firma (implementar si es necesario)
- ✅ No exponer las API keys en el frontend
- ✅ Usar HTTPS en producción

## 📱 URLs de Redirección

Después del pago, Rapyd redirige al usuario a:

- **Pago exitoso**: `{FRONTEND_URL}/recargas?success=true`
- **Pago cancelado**: `{FRONTEND_URL}/recargas?cancelled=true`
- **Error en pago**: `{FRONTEND_URL}/recargas?error=true`

Implementar en el frontend para mostrar mensajes apropiados.

## 🛠️ Comandos Útiles

```bash
# Ver logs del backend
npm run dev

# Verificar variables de entorno
echo $RAPYD_ACCESS_KEY  # Linux/Mac
echo %RAPYD_ACCESS_KEY% # Windows CMD
$env:RAPYD_ACCESS_KEY   # Windows PowerShell

# Reiniciar base de datos (si agregaste nuevas columnas)
# CUIDADO: Esto elimina todos los datos
npm run db:reset
```

## 📚 Documentación Adicional

- [Rapyd API Reference](https://docs.rapyd.net/)
- [Rapyd Checkout Guide](https://docs.rapyd.net/build-with-rapyd/docs/checkout-toolkit)
- [Rapyd Webhooks](https://docs.rapyd.net/build-with-rapyd/docs/webhooks)

---

**Última actualización**: Enero 2026
**Versión**: 2.2
