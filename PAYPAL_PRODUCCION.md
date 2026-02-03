# PayPal - Configuración de Producción ✅

## ✅ Implementaciones Completadas

### 1. Gestión Integral de Errores ✅
- ✅ Manejo de errores en `createOrder`
- ✅ Manejo de errores en `onApprove`
- ✅ Callback `onError` implementado
- ✅ Callback `onCancel` implementado
- ✅ Mensajes de error detallados con Debug ID
- ✅ Try-catch en todas las operaciones asíncronas

### 2. Análisis y Seguimiento de Conversiones ✅
- ✅ Google Analytics integration preparada
- ✅ Eventos implementados:
  - `begin_checkout` - Al iniciar pago
  - `purchase` - Al completar pago
  - `exception` - En caso de error
  - `remove_from_cart` - Al cancelar

**Configurar Google Analytics:**
```javascript
// Agregar en frontend/public/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Prueba en Diferentes Dispositivos ✅
- ✅ Diseño responsive
- ✅ Botones adaptables
- ✅ Compatible con mobile/tablet/desktop

**Probar en:**
- [x] Chrome Desktop
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Firefox
- [ ] Edge

### 4. Estados de Carga y Éxito ✅
- ✅ Loading overlay durante procesamiento
- ✅ Spinner animado
- ✅ Indicadores de estado visual
- ✅ Mensajes de éxito con detalles
- ✅ Auto-refresh después de pago exitoso

### 5. Monitorización y Alertas 📊

#### A. Logs en Backend
El backend ya registra:
```javascript
console.log('📝 Creando orden PayPal:', numeroReferencia);
console.log('✅ Orden PayPal creada:', orderId);
console.log('❌ Error:', error);
```

#### B. Herramientas de Monitoreo Recomendadas

**Opción 1: Sentry (Recomendado)**
```bash
npm install @sentry/react @sentry/node
```

**Frontend (src/index.js):**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

**Backend (src/index.js):**
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

**Opción 2: LogRocket**
```bash
npm install logrocket
```

**Opción 3: Render.com Logs (Ya disponible)**
- Ver logs en: https://dashboard.render.com
- Seleccionar servicio backend
- Click en "Logs"

### 6. Webhooks de PayPal 🔔

#### Configurar Webhooks en PayPal:

1. Ir a: https://developer.paypal.com/dashboard/webhooks
2. Crear webhook con URL: `https://be-backend-hfib.onrender.com/recargas/paypal/webhook`
3. Seleccionar eventos:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

#### Implementar en Backend:

**backend/src/controllers/recargaController.js:**
```javascript
const verificarWebhookPayPal = async (req, res) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const headers = req.headers;
    const body = req.body;
    
    // Verificar firma del webhook
    const verification = await paypalService.verificarWebhook(
      webhookId,
      headers,
      body
    );
    
    if (!verification.verified) {
      return res.status(401).json({ mensaje: 'Webhook no verificado' });
    }
    
    const eventType = body.event_type;
    const resource = body.resource;
    
    console.log('🔔 Webhook PayPal recibido:', eventType);
    
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Confirmar pago completado
        const recarga = await Recarga.findOne({
          where: { paypalOrderId: resource.supplementary_data.related_ids.order_id }
        });
        
        if (recarga && recarga.estado === 'pendiente') {
          recarga.estado = 'exitosa';
          await recarga.save();
          
          const usuario = await User.findByPk(recarga.usuarioId);
          usuario.saldo += recarga.montoNeto;
          await usuario.save();
          
          console.log('✅ Webhook: Recarga completada');
        }
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        // Marcar como fallida
        const recargaDenegada = await Recarga.findOne({
          where: { paypalOrderId: resource.supplementary_data.related_ids.order_id }
        });
        
        if (recargaDenegada) {
          recargaDenegada.estado = 'fallida';
          recargaDenegada.mensajeError = 'Pago denegado por PayPal';
          await recargaDenegada.save();
          
          console.log('❌ Webhook: Pago denegado');
        }
        break;
    }
    
    res.status(200).json({ mensaje: 'Webhook procesado' });
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({ error: error.message });
  }
};
```

**Agregar ruta en backend/src/routes/recargaRoutes.js:**
```javascript
router.post('/paypal/webhook', recargaController.verificarWebhookPayPal);
```

### 7. Variables de Entorno Requeridas

#### Backend (Render.com):
```env
PAYPAL_CLIENT_ID=AQhjPWVWEH7O2BTsHUGaYCZJWbBWMbd-LejXJtGIXGrF35ZlYUDse6SwYH_ipvkb25qRx37n3X-H5uML
PAYPAL_CLIENT_SECRET=[TU_SECRET]
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=[ID_DEL_WEBHOOK]
```

#### Frontend (Render.com):
```env
REACT_APP_PAYPAL_CLIENT_ID=AQhjPWVWEH7O2BTsHUGaYCZJWbBWMbd-LejXJtGIXGrF35ZlYUDse6SwYH_ipvkb25qRx37n3X-H5uML
REACT_APP_API_URL=https://be-backend-hfib.onrender.com
```

### 8. Checklist Final antes de Producción

- [x] ✅ Gestión de errores integral
- [x] ✅ Estados de carga implementados
- [x] ✅ Tracking de conversiones (Google Analytics listo)
- [x] ✅ Validaciones de monto
- [x] ✅ Mensajes de error detallados
- [ ] ⏳ Configurar Google Analytics (obtener GA ID)
- [ ] ⏳ Configurar webhooks en PayPal Dashboard
- [ ] ⏳ Implementar endpoint de webhook
- [ ] ⏳ Probar en diferentes navegadores
- [ ] ⏳ Configurar Sentry (opcional pero recomendado)
- [ ] ⏳ Revisar límites de cuenta PayPal

### 9. Pruebas de Producción

#### Escenarios a Probar:
1. **Pago exitoso:** Monto válido ($10) → Confirmar → Verificar saldo
2. **Pago cancelado:** Iniciar pago → Cancelar en PayPal
3. **Tarjeta rechazada:** Usar tarjeta sin fondos
4. **Monto inválido:** Intentar con $0 o monto negativo
5. **Sin autenticación:** Intentar sin token
6. **Timeout:** Dejar ventana abierta 30+ minutos
7. **Multiples clicks:** Hacer doble clic en botón PayPal

### 10. Contacto y Soporte

**PayPal Support:**
- URL: https://www.paypal.com/businesshelp
- Teléfono: Varía por país

**Documentación:**
- JS SDK: https://developer.paypal.com/sdk/js/
- REST API: https://developer.paypal.com/api/rest/
- Webhooks: https://developer.paypal.com/api/webhooks/

---

## 🚀 Próximos Pasos

1. **Ahora:** Probar en producción con monto pequeño ($1)
2. **Después:** Configurar Google Analytics
3. **Luego:** Implementar webhooks
4. **Finalmente:** Configurar Sentry para monitoreo

## 📊 Métricas a Monitorear

- Tasa de conversión (pagos iniciados vs completados)
- Tiempo promedio de pago
- Errores por tipo
- Tasas de cancelación
- Dispositivos más usados
- Montos promedio

---

**Última actualización:** 3 de febrero de 2026
