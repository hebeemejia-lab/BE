# 🤖 Verificación reCAPTCHA v3 - Inicio de Sesión

## ✅ Implementación Completada

Se ha agregado Google reCAPTCHA v3 al formulario de inicio de sesión para proteger contra bots y accesos no autorizados.

---

## 📋 ¿Qué es reCAPTCHA v3?

reCAPTCHA v3 es un sistema de verificación invisible que:
- ✅ **No molesta al usuario**: No requiere clic en checkbox ni completar desafíos
- ✅ **Usa inteligencia artificial**: Analiza el comportamiento del usuario
- ✅ **Retorna una puntuación**: De 0 (bot) a 1 (humano)
- ✅ **Basado en riesgo**: Puede ajustar umbrales según el tipo de acción

---

## 🔧 Componentes Implementados

### Frontend (React)

**Archivo**: `frontend/src/pages/Login.js`

```javascript
// Nuevas importaciones
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// En el submit del formulario
const recaptchaToken = await executeRecaptcha('login');
await login(email, password, recaptchaToken);
```

**Características**:
- Hook `useGoogleReCaptcha()` para obtener token
- Envío automático al hacer login
- Aviso de privacidad de Google visible
- Manejo de errores si reCAPTCHA no está disponible

---

### Backend (Node.js/Express)

**Archivo**: `backend/src/middleware/recaptchaMiddleware.js`

**Funciones**:
1. Recibe el token del frontend
2. Verifica con Google (API de verificación)
3. Valida la puntuación contra el umbral
4. Valida la acción ('login')
5. Permite o rechaza el login

**Configuración por variables de entorno**:
```env
RECAPTCHA_SECRET_KEY=6LeALcIqAAAAANj-X3nZ8kR3vXy-ELzDx9qV2K4x
RECAPTCHA_THRESHOLD=0.5
```

---

## 🔐 Flujo de Verificación

```
┌─────────────────────────────────────────────────────────┐
│                   Usuario ingresa email y contraseña     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend ejecuta reCAPTCHA v3 (invisible, sin clic)    │
│  executeRecaptcha('login') → obtiene token              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼ (incluye token en POST)
┌─────────────────────────────────────────────────────────┐
│  POST /auth/login                                       │
│  {email, password, recaptchaToken}                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Middleware verificarRecaptcha ejecutado                │
│  - Envía token a Google para validar                    │
│  - Recibe: {success, score, action}                     │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
            ┌──────────┐  ┌──────────────┐
            │ Score OK │  │ Score bajo   │
            │(≥ 0.5)   │  │(< 0.5) = Bot │
            └────┬─────┘  └──────┬───────┘
                 │               │
                 ▼               ▼
            ┌──────────┐  ┌─────────────┐
            │ Continúa │  │ Rechaza (403)│
            │  login   │  │ "No humano"  │
            └──────────┘  └─────────────┘
```

---

## 📊 Puntuaciones de reCAPTCHA

| Score | Significado |
|-------|------------|
| 0.0 - 0.3 | Muy probable que sea bot |
| 0.3 - 0.7 | Comportamiento sospechoso |
| 0.7 - 1.0 | Comportamiento legítimo |

**Umbral configurado**: 0.5 (rechaza si score < 0.5)

---

## 🛠️ Variables de Entorno Necesarias

### Frontend (`.env`)
```env
REACT_APP_RECAPTCHA_SITE_KEY=6LfALcIqAAAAAKDj-QKUhgZDw2JaDPQ3CQr2L0Eg
```

### Backend (`.env`)
```env
RECAPTCHA_SECRET_KEY=6LeALcIqAAAAANj-X3nZ8kR3vXy-ELzDx9qV2K4x
RECAPTCHA_THRESHOLD=0.5
NODE_ENV=production
```

---

## 📦 Dependencias Instaladas

### Frontend
```bash
npm install react-google-recaptcha-v3
```

### Backend
- `axios` (ya estaba instalado)

---

## 🚀 Cómo Funciona en Práctica

### Paso 1: Usuario intenta login
- Ingresa email y contraseña
- Hace clic en "Iniciar Sesión"

### Paso 2: reCAPTCHA se ejecuta silenciosamente
- Analiza el comportamiento del usuario
- Envía puntuación a Google
- No hay capcha visible ni desafío

### Paso 3: Backend valida
- Verifica que sea humano (score ≥ 0.5)
- Si es válido: continúa con login normal
- Si es bot: rechaza con error 403

### Paso 4: Usuario ve resultado
- **Si es humano**: Se inicia sesión normalmente
- **Si es bot/sospechoso**: Mensaje de error "No pudimos verificar que eres humano"

---

## 🔍 Logs y Monitoreo

### En el backend se registran:
```
✅ reCAPTCHA válido - Score: 0.92
⚠️ reCAPTCHA Score bajo (0.3). Posible bot
❌ reCAPTCHA falló: Token inválido o expirado
```

---

## 🌐 URLs de Google Relacionadas

- **API de verificación**: `https://www.google.com/recaptcha/api/siteverify`
- **Política de privacidad**: `https://policies.google.com/privacy`
- **Términos de servicio**: `https://policies.google.com/terms`

---

## ⚙️ Configuración Avanzada

### Cambiar el umbral de puntuación

En `.env`:
```env
RECAPTCHA_THRESHOLD=0.6  # Más estricto
RECAPTCHA_THRESHOLD=0.3  # Más permisivo
```

### Desactivar en desarrollo

El middleware está configurado para saltarse en modo `development`:
```env
NODE_ENV=development  # Salta validación de reCAPTCHA
NODE_ENV=production   # Valida reCAPTCHA
```

---

## 📄 Aviso Legal

El formulario muestra:
> "Este sitio está protegido por reCAPTCHA y se aplican la Política de Privacidad y Términos de Servicio de Google."

Con enlaces a:
- https://policies.google.com/privacy
- https://policies.google.com/terms

---

## 🔐 Seguridad

✅ **Secret Key protegida**: Solo se usa en el backend  
✅ **Token de un solo uso**: Cada login genera nuevo token  
✅ **Validación de acción**: Solo acepta 'login'  
✅ **Threshold configurable**: Ajustable según necesidades  
✅ **Logging detallado**: Todos los intentos se registran  

---

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile (iOS, Android)
- ✅ Funciona sin JavaScript adicional del usuario
- ✅ Invisible, no interfiere con la UX

---

## 🎯 Casos de Uso

| Caso | Resultado |
|------|----------|
| Usuario normal en el horario | ✅ Score alto (0.8-1.0) → Acceso |
| Usuario desde IP nueva | ⏳ Score medio (0.5-0.8) → Validación |
| Bot o ataque bruteforce | ❌ Score bajo (0-0.5) → Rechazado |
| Múltiples intentos fallidos | ❌ Score bajo → Rechazado |

---

## 🚨 Troubleshooting

### Error: "reCAPTCHA Site Key no está configurado"
**Solución**: Verificar que `REACT_APP_RECAPTCHA_SITE_KEY` esté en `.env`

### Error: "RECAPTCHA_SECRET_KEY no está configurado"
**Solución**: Verificar que `RECAPTCHA_SECRET_KEY` esté en backend `.env`

### Score siempre bajo
**Solución**: Ajustar `RECAPTCHA_THRESHOLD` a un valor más permisivo (0.3-0.4)

### Token expirado
**Solución**: Los tokens son válidos solo 2 minutos. Si el usuario espera, debe reintentarUsuario vuelve a hacer login.

---

## 📞 Soporte de Google

- [Documentación oficial](https://developers.google.com/recaptcha/docs/v3)
- [Console de reCAPTCHA](https://www.google.com/recaptcha/admin)
- [Contacto de Google](https://www.google.com/recaptcha/about/)

---

**Estado**: ✅ Completamente funcional  
**Última actualización**: Febrero 2026  
**Versión de reCAPTCHA**: v3  
**Nivel de seguridad**: Alto 🔒
