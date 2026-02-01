# PayPal Payouts & Retiros Manuales - Implementación Completa

## ✅ Cambios Realizados

### 1. **Servicio PayPal Payouts** (`paypalPayoutsService.js`)
- ✅ Transferencias REALES de dinero a través de PayPal
- ✅ Usa las mismas credenciales LIVE de PayPal ya configuradas
- ✅ Valida emails antes de procesar
- ✅ Obtiene estado de pagos en PayPal

### 2. **Modelo SolicitudRetiroManual**
- ✅ Almacena solicitudes de retiro pendientes
- ✅ Estados: pendiente, aprobada, rechazada, procesada
- ✅ Incluye información de auditoría (procesado por, fecha)
- ✅ Soporta dos métodos: PayPal Payouts o Transferencias Manuales

### 3. **Controlador de Retiros Mejorado**
- ✅ `procesarRetiro()` - Permite elegir entre PayPal Payout automático o solicitud manual
- ✅ `obtenerSolicitudesRetiroManuales()` - Admin puede ver todas las solicitudes
- ✅ `aprobarSolicitudRetiroManual()` - Admin aprueba y procesa PayPal Payout
- ✅ `rechazarSolicitudRetiroManual()` - Admin rechaza y devuelve dinero
- ✅ `obtenerEstadoSolicitudRetiro()` - Ver estado en PayPal

### 4. **Rutas de Admin** (`adminRetiroRoutes.js`)
```
GET  /admin/solicitudes-retiro                    → Listar solicitudes
GET  /admin/solicitudes-retiro/:id/estado        → Ver estado
POST /admin/solicitudes-retiro/:id/aprobar       → Aprobar solicitud
POST /admin/solicitudes-retiro/:id/rechazar      → Rechazar solicitud
```

## 🎯 Flujo de Retiros

### **Opción 1: PayPal Payout Automático (RECOMENDADO)**
```
Usuario solicita retiro con metodoRetiro: 'paypal_payout'
         ↓
Validaciones (saldo, cuenta, email)
         ↓
Llamada a PayPal API (LIVE - DINERO REAL)
         ↓
Si ÉXITO:
  - Dinero se transfiere realmente a PayPal del usuario
  - Estado: 'exitosa'
  - Se crea registro en tabla Recarga
         ↓
Si FALLO:
  - Se crea solicitud manual pendiente de aprobación
  - Admin debe aprobar manualmente
  - Estado: 'pendiente'
```

### **Opción 2: Solicitud de Retiro Manual**
```
Usuario solicita retiro con metodoRetiro: 'transferencia_manual'
         ↓
Se crea solicitud en SolicitudRetiroManual
         ↓
Dinero se reserva (resta del saldo pero no se procesa)
         ↓
Admin recibe notificación de solicitud pendiente
         ↓
Admin APRUEBA:
  - Se crea registro en tabla Recarga
  - Estado: 'aprobada'
  - Dinero se transfiere manualmente (admin debe hacerlo fuera del sistema)
         ↓
Admin RECHAZA:
  - Dinero se devuelve al saldo del usuario
  - Se especifica razón de rechazo
```

## 📦 Configuración Requerida

**Verifica que estas variables estén configuradas en `.env`:**

```env
# PayPal (LIVE - Dinero Real)
PAYPAL_MODE=live
PAYPAL_BASE_URL=https://api-m.paypal.com
PAYPAL_CLIENT_ID=AQhjPWVWEH7O2BTsHUGaYCZJWbBWMbd-LejXJtGIXGrF35ZlYUDse6SwYH_ipvkb25qRx37n3X-H5uML
PAYPAL_CLIENT_SECRET=EP7TBW_82TAQpfN_jjgNnUgPxBINI_9fixaPq_qObeZmUBdJx2fXE4CyPcl-KaL08TD47zxEZw2fn2ls
```

## 🚀 Cómo Usar

### **Para Usuarios: Solicitar Retiro**

```bash
# Opción 1: PayPal Payout Automático (Instantáneo)
POST /retiros/procesar
{
  "monto": 100,
  "moneda": "USD",
  "cuentaId": 1,
  "metodoRetiro": "paypal_payout"
}

# Opción 2: Solicitud Manual (Requiere aprobación)
POST /retiros/procesar
{
  "monto": 100,
  "moneda": "USD",
  "cuentaId": 1,
  "metodoRetiro": "transferencia_manual"
}
```

### **Para Admin: Gestionar Solicitudes**

```bash
# Ver todas las solicitudes pendientes
GET /admin/solicitudes-retiro?estado=pendiente

# Ver estado de una solicitud
GET /admin/solicitudes-retiro/5/estado

# Aprobar solicitud (procesa PayPal Payout)
POST /admin/solicitudes-retiro/5/aprobar
{
  "notasAdmin": "Aprobado - Payout enviado exitosamente"
}

# Rechazar solicitud (devuelve dinero al usuario)
POST /admin/solicitudes-retiro/5/rechazar
{
  "razonRechazo": "Datos bancarios incorrectos. Por favor contacte con soporte."
}
```

## 📊 Base de Datos

### **Tabla: solicitudes_retiro_manual**
```sql
- id (PK)
- usuarioId (FK)
- monto (DECIMAL)
- moneda (STRING)
- metodo (ENUM: paypal_payout | transferencia_manual)
- estado (ENUM: pendiente | aprobada | rechazada | procesada)
- nombreUsuario, emailUsuario, cedulaUsuario
- banco, tipoCuenta, numeroCuenta, nombreBeneficiario
- batchIdPayPal (para trackear en PayPal)
- numeroReferencia (único)
- notasAdmin (texto)
- procesadoPor (FK a User - admin que procesó)
- fechaProcesamiento (DATE)
- razonRechazo (si fue rechazada)
- createdAt, updatedAt
```

### **Tabla: recargas** (Ahora incluye retiros)
```sql
- metodo = 'paypal_payout' → Retiro procesado por PayPal
- metodo = 'retiro' → Retiro antiguo (deprecated)
- estado = 'exitosa' → Dinero transferido
```

## ⚠️ Notas Importantes

1. **PayPal LIVE**: El dinero es REAL. Verifica que las credenciales sean correctas.
2. **Email requerido**: Los usuarios DEBEN tener email válido para PayPal Payouts.
3. **Fallback automático**: Si PayPal falla, se crea solicitud manual automáticamente.
4. **Reserva de dinero**: En retiros manuales, el dinero se resta del saldo inmediatamente.
5. **Auditoría**: Cada aprobación/rechazo queda registrada con admin y timestamp.

## 🔄 Flujo Completo de Ejemplo

```
1. Usuario recarga $100 con PayPal → Saldo: $100 ✅

2. Usuario solicita retiro $50 con PayPal Payout
   - Validación: OK
   - PayPal Payout: $50 transferidos ✅
   - Saldo: $50
   - Estado: exitosa

3. Usuario solicita retiro $30 con solicitud manual
   - Validación: OK
   - Solicitud creada: pendiente
   - Saldo: $20 (dinero reservado)
   - Admin recibe notificación

4. Admin aprueba solicitud
   - PayPal Payout: $30 transferidos ✅
   - Estado: procesada
   - Saldo final: $20

5. Usuario intenta retiro de $100 (tiene $20)
   - Error: Saldo insuficiente ❌
```

## 🐛 Troubleshooting

### **Error: "Email inválido para PayPal Payout"**
- El usuario no tiene email configurado en su perfil
- Solución: Editar perfil con email válido

### **Error: "PayPal Payout falló"**
- Credenciales incorrectas o expired
- Cuenta PayPal con restricciones
- Solución: Crear solicitud manual y procesar después

### **Solicitud pendiente no aparece en admin**
- Verifica que el usuario tenga rol admin
- Usa endpoint GET /admin/solicitudes-retiro

## 📈 Próximas Mejoras

- [ ] Webhooks de PayPal para actualizar estado automáticamente
- [ ] Notificaciones a usuario cuando solicitud es procesada
- [ ] Reintento automático de PayPal Payouts fallidos
- [ ] Límites de retiro diario/semanal
- [ ] Comisiones configurables por retiro
- [ ] Soporte para múltiples métodos de retiro (Stripe ACH, Wise, etc.)
