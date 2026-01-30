# Configuración de SMTP para Banco Exclusivo

## Correo: banco.exclusivo@bancoexclusivo.lat

Tienes **2 opciones** para enviar correos:

---

## OPCIÓN 1: Gmail SMTP (Recomendado - Gratis hasta 2000 correos/día)

### Paso 1: Configurar Gmail

1. **Crear cuenta Gmail** (o usar existente):
   - Ve a https://mail.google.com
   - Crea una cuenta con cualquier nombre (ej: bancoexclusivo.app@gmail.com)

2. **Habilitar "Aplicaciones menos seguras"** o **Contraseña de aplicación**:
   
   **Opción A - Contraseña de aplicación (Más seguro):**
   - Ve a tu cuenta de Google: https://myaccount.google.com
   - Seguridad → Verificación en dos pasos (actívala si no la tienes)
   - Seguridad → Contraseñas de aplicación
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "Banco Exclusivo Backend"
   - Copia la contraseña de 16 caracteres generada
   
   **Opción B - Menos segura:**
   - Ve a https://myaccount.google.com/lesssecureapps
   - Activa "Permitir aplicaciones menos seguras"

3. **Configurar variables en Render:**

   Ve a tu Backend en Render → Environment → Add Environment Variable:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tuCorreo@gmail.com
   SMTP_PASS=tu_contraseña_de_aplicacion
   SMTP_FROM=banco.exclusivo@bancoexclusivo.lat
   ```

---

## OPCIÓN 2: SMTP de tu dominio (bancoexclusivo.lat)

Si tienes hosting con tu dominio, puedes usar el SMTP del hosting.

### Proveedores comunes:

**Hostinger:**
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=banco.exclusivo@bancoexclusivo.lat
SMTP_PASS=tu_contraseña_del_email
SMTP_FROM=banco.exclusivo@bancoexclusivo.lat
```

**cPanel/SiteGround/Bluehost:**
```
SMTP_HOST=mail.bancoexclusivo.lat
SMTP_PORT=587
SMTP_USER=banco.exclusivo@bancoexclusivo.lat
SMTP_PASS=tu_contraseña_del_email
SMTP_FROM=banco.exclusivo@bancoexclusivo.lat
```

**GoDaddy:**
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_USER=banco.exclusivo@bancoexclusivo.lat
SMTP_PASS=tu_contraseña_del_email
SMTP_FROM=banco.exclusivo@bancoexclusivo.lat
```

---

## OPCIÓN 3: SendGrid (Gratis hasta 100 correos/día)

1. Registrarse en https://sendgrid.com/
2. Crear API Key
3. Configurar:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=TU_API_KEY_DE_SENDGRID
SMTP_FROM=banco.exclusivo@bancoexclusivo.lat
```

---

## Envío Masivo de Verificación

Una vez configurado el SMTP, puedes enviar correos a todos los usuarios:

### En Render (Producción):

1. Ve a Render → Backend → Shell
2. Ejecuta:
   ```bash
   npm run verificacion-masiva
   ```

### En Local (Testing):

```bash
cd backend
npm run verificacion-masiva
```

Esto enviará correos de verificación a **todos los usuarios que NO estén verificados**.

---

## Verificar que funciona

1. Agrega las variables SMTP en Render
2. Espera 2-3 minutos a que se redespliegue
3. Intenta registrar un nuevo usuario desde https://www.bancoexclusivo.lat/register
4. Revisa el correo (y la carpeta spam)

---

## Notas importantes

- **Gmail gratis:** 2000 correos/día
- **SendGrid gratis:** 100 correos/día
- **SMTP del dominio:** Depende del hosting (usualmente 500-1000/día)
- Los correos pueden tardar 1-5 minutos en llegar
- Siempre revisa la carpeta de spam primero
- El token de verificación expira en 24 horas

---

## Solución de problemas

**Error: "Invalid login"**
- Verifica que SMTP_USER y SMTP_PASS sean correctos
- Si usas Gmail, asegúrate de usar contraseña de aplicación

**No llegan los correos:**
- Revisa spam
- Verifica que SMTP_FROM sea válido
- Checa los logs de Render

**Error: "Connection timeout"**
- Verifica SMTP_HOST y SMTP_PORT
- Algunos hostings bloquean puerto 587, prueba 465

---

## Recomendación final

**Para empezar rápido:** Usa Gmail SMTP (Opción 1)  
**Para producción profesional:** Configura el SMTP de tu dominio (Opción 2)  
**Para alto volumen:** Usa SendGrid o similar
