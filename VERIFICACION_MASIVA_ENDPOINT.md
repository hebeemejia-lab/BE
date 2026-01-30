# Endpoint de Verificación Masiva

## Descripción
Envía emails de verificación a todos los usuarios que NO han verificado su email.

## Cómo usarlo

### Opción 1: Desde el navegador (más fácil)

1. **Inicia sesión** en el admin con:
   - Email: `admin@bancoexclusivo.lat`
   - Contraseña: `2406`

2. **Abre esta URL en una pestaña nueva:**
```
https://be-api-ygdy.onrender.com/admin/verificacion-masiva
```

3. **Cambia `GET` a `POST`** en la barra de direcciones (o usa Postman)

4. **Presiona Enter** - verás el reporte en JSON con:
   - Cantidad de emails enviados
   - Cantidad de errores
   - Detalle de cada usuario

### Opción 2: Desde Postman (si tienes Postman instalado)

1. Abre Postman
2. **Método:** POST
3. **URL:** `https://be-api-ygdy.onrender.com/admin/verificacion-masiva`
4. **Headers:** 
   - Authorization: `Bearer <tu_token_jwt>`
5. **Send**

### Opción 3: Desde cURL en Terminal

```bash
curl -X POST https://be-api-ygdy.onrender.com/admin/verificacion-masiva \
  -H "Authorization: Bearer <tu_token_jwt>"
```

## Respuesta Esperada

```json
{
  "exito": true,
  "mensaje": "Verificación masiva completada",
  "emailsEnviados": 15,
  "errores": 0,
  "total": 15,
  "reporte": [
    {
      "email": "usuario1@gmail.com",
      "estado": "✅ Enviado"
    },
    {
      "email": "usuario2@gmail.com",
      "estado": "✅ Enviado"
    }
  ]
}
```

## Notas

- ✅ Solo el **ADMIN** puede usar este endpoint
- ✅ Cada usuario recibe un email único con su link de verificación
- ✅ El link expira en **24 horas**
- ✅ Los usuarios solo pueden verificar **una sola vez** con su token
