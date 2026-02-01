# 🚀 Configuración de Render para Banco Exclusivo

## Problema Común: Error 500 en `/recargas/crear-paypal`

Si ves un error 500 al intentar crear una recarga con PayPal en Render, es porque **faltan variables de entorno**.

---

## ✅ Solución: Configurar Variables de Entorno en Render

### Paso 1: Acceder a Render Dashboard
1. Ve a https://render.com
2. Inicia sesión con tu cuenta
3. Selecciona tu servicio "banco-backend"

### Paso 2: Ir a Environment Variables
1. Haz clic en **Settings** (o "Configuración")
2. Busca la sección **Environment** o **Environment Variables**
3. Haz clic en **Add Environment Variable**

### Paso 3: Agregar Variables Requeridas

Copia estas variables y proporciona sus valores:

```
JWT_SECRET
Valor: tu_secreto_jwt_super_seguro

PAYPAL_MODE
Valor: live

PAYPAL_BASE_URL
Valor: https://api-m.paypal.com

PAYPAL_CLIENT_ID
Valor: AQUI_TU_CLIENT_ID_DE_PAYPAL

PAYPAL_CLIENT_SECRET
Valor: AQUI_TU_SECRET_DE_PAYPAL

FRONTEND_URL
Valor: https://www.bancoexclusivo.lat

RAPYD_ACCESS_KEY
Valor: tu_rapyd_key

RAPYD_SECRET_KEY
Valor: tu_rapyd_secret

STRIPE_PUBLIC_KEY
Valor: pk_live_...

STRIPE_SECRET_KEY
Valor: sk_live_...

TWOCHECKOUT_MERCHANT_CODE
Valor: tu_codigo

TWOCHECKOUT_PUBLISHABLE_KEY
Valor: tu_key
```

### Paso 4: Guardar y Redeploy

1. Haz clic en **Save** (Guardar)
2. Render automáticamente hará redeploy del servicio
3. Espera a que termine (verás "Deploy successful")

---

## 🔍 Obtener Credenciales de PayPal

### Para Credenciales LIVE (Real Money):
1. Ve a https://www.paypal.com/developers
2. Inicia sesión con tu cuenta de negocio
3. Ve a **Apps & Credentials**
4. Asegúrate de estar en tab **Live**
5. Bajo "Sandbox" (pero en modo LIVE), copia:
   - **Client ID** → `PAYPAL_CLIENT_ID`
   - **Secret** → `PAYPAL_CLIENT_SECRET`

---

## 🧪 Verificar Configuración

Una vez configuradas las variables, puedes verificar si funcionan:

```bash
# Hacer una solicitud de prueba
curl -X POST https://be-backend-hfib.onrender.com/recargas/crear-paypal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"monto": 10}'
```

### Respuesta Esperada (Éxito):
```json
{
  "mensaje": "Orden PayPal creada",
  "checkoutUrl": "https://www.sandbox.paypal.com/...",
  "orderId": "...",
  "recargaId": 1,
  "monto": 10,
  "numeroReferencia": "PP-1706..."
}
```

### Respuesta Error (Credenciales Falta):
```json
{
  "error": "Credenciales de PayPal no configuradas en el servidor",
  "detalles": "PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET falta en .env",
  "ayuda": "Contacta al administrador del servidor"
}
```

---

## 🛠️ Variables Opcionales

Estas no son obligatorias pero mejoran la experiencia:

```
NODE_ENV
Valor: production

PORT
Valor: 5000

DATABASE_URL
Valor: postgresql://user:pass@host/db (si usas PostgreSQL en lugar de SQLite)
```

---

## 📋 Checklist de Configuración

- [ ] He accedido a Render Dashboard
- [ ] He encontrado mi servicio "banco-backend"
- [ ] He ido a Settings > Environment
- [ ] He agregado `PAYPAL_CLIENT_ID`
- [ ] He agregado `PAYPAL_CLIENT_SECRET`
- [ ] He agregado `FRONTEND_URL`
- [ ] He guardado los cambios
- [ ] He esperado a que termine el redeploy
- [ ] He probado el endpoint `/recargas/crear-paypal`

---

## 🆘 Troubleshooting

### Error: "Invalid client_id"
- Verifica que `PAYPAL_CLIENT_ID` sea exactamente igual (sin espacios)
- Asegúrate de estar usando credenciales LIVE, no SANDBOX

### Error: "Client authentication failed"
- El `PAYPAL_CLIENT_SECRET` es incorrecto
- Copia nuevamente desde PayPal Dashboard

### Error: "Request failed with status code 500"
- Falta una o más variables de entorno
- Verifica que todas las variables estén en Render

### Los cambios no se reflejan después de agregar variables
- Espera a que termine el redeploy (puede tomar 1-2 minutos)
- Refresca la página del navegador (Ctrl+F5)

---

## 📝 Notas Importantes

1. **NUNCA** compartas `PAYPAL_CLIENT_SECRET` en el código
2. **SIEMPRE** usa variables de entorno para credenciales
3. En Render, las variables se inyectan automáticamente en el contenedor
4. Después de cambiar variables, el servicio se reinicia automáticamente
5. Para cambios de código, necesitas hacer un nuevo deploy (push a GitHub)

---

## 🔒 Seguridad

Render permite que las variables de entorno sean:
- ✅ Seguras (encriptadas en reposo)
- ✅ Privadas (no visibles en logs públicos)
- ✅ Aisladas (cada servicio tiene sus propias variables)

---

## 📞 Soporte

Si después de configurar todo sigue fallando:

1. Haz clic en **Logs** en Render
2. Busca líneas que digan `❌ Error PayPal:`
3. Copia el error completo
4. Contacta al administrador con el error exacto

Ejemplo de log útil:
```
❌ Error PayPal: PayPal token error: {"error":"invalid_client","error_description":"Client authentication failed"}
```

Esto indica que las credenciales son incorrectas.
