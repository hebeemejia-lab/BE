# Desvinculación de Saldo de Préstamos

## Problema
En modo Sandbox, la API de PayPal se confundía cuando los préstamos aprobados agregaban dinero al saldo de la cuenta del usuario.

## Solución Implementada

### Backend
**Archivo modificado:** `backend/src/controllers/loanController.js`

**Cambio realizado:**
- Eliminadas las líneas 129-130 que agregaban el monto del préstamo al saldo del usuario
- Ahora cuando se aprueba un préstamo, el usuario recibe la aprobación pero NO se agrega dinero a su balance

```javascript
// ANTES (líneas 129-130):
const usuario = await User.findByPk(prestamo.usuarioId);
usuario.saldo = parseFloat(usuario.saldo) + monto;
await usuario.save();

// AHORA:
const usuario = await User.findByPk(prestamo.usuarioId);
// NO agregamos el monto al saldo porque es modo Sandbox
// y la API de PayPal se confunde con los montos de préstamos
// El préstamo se aprueba pero NO afecta el balance de la cuenta
```

### Comportamiento Actual
1. Usuario solicita un préstamo ✅
2. Admin aprueba el préstamo ✅
3. Usuario recibe notificación de aprobación ✅
4. **Préstamo NO afecta el saldo de la cuenta** ✅
5. PayPal Sandbox funciona sin confusión ✅

### Script de Reseteo
Se creó `backend/resetear-saldo-prestamos.js` para uso futuro si se necesita resetear saldos que fueron agregados por préstamos previamente.

## Ventajas
- ✅ Evita confusión en PayPal Sandbox
- ✅ Saldo de cuenta más preciso
- ✅ Préstamos se manejan independientemente
- ✅ Sistema más limpio y mantenible

## Fecha
4 de febrero, 2026
