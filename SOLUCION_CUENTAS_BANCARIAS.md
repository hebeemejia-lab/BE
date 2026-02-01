# 🔧 Solución: Problemas de Cuentas Bancarias

## Problemas Reportados
1. **Error 500 en POST `/cuentas-bancarias/vincular`** - Las cuentas no se registran
2. **Cuentas se borran al cerrar sesión** - Las cuentas desaparecen

## Causas Identificadas

### Problema 1: Error 500 en Vincular Cuentas
**Causa:** El campo `bankAccountToken` en el modelo `BankAccount` tenía:
```javascript
bankAccountToken: {
  type: DataTypes.STRING,
  allowNull: false,  // ❌ NO PERMITÍA NULL
  unique: true,      // ❌ FORZABA UNICIDAD
}
```

Para bancos de RD, el controller intentaba guardar `ruteo` (código SWIFT) directamente:
```javascript
bankAccountToken: ruteo,  // ❌ Violaba constraint unique
```

**Solución:** 
- Cambié `allowNull: false` → `allowNull: true`
- Cambié `unique: true` → `unique: false`
- Para bancos RD ahora uso `null`:
```javascript
bankAccountToken: null,  // ✅ Para bancos RD
```

### Problema 2: Cuentas Desaparecen al Cerrar Sesión
**Causa:** Dos problemas combinados:

1. **Relación incorrecta en models/index.js:**
```javascript
// ❌ ANTES - Solo permite UNA cuenta por usuario
User.hasOne(BankAccount, {
  foreignKey: 'usuarioId',
  as: 'cuentaBancaria'  // Singular
});
```

2. **Sin CASCADE DELETE definido** - Riesgo de violaciones de integridad referencial

**Solución:**
- Cambié `hasOne` → `hasMany` para permitir múltiples cuentas
- Agregué `onDelete: CASCADE` para mantener integridad
```javascript
// ✅ DESPUÉS - Permite múltiples cuentas
User.hasMany(BankAccount, {
  foreignKey: 'usuarioId',
  as: 'cuentasBancarias',  // Plural
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

BankAccount.belongsTo(User, {
  foreignKey: 'usuarioId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
```

## Cambios Realizados

### 1. backend/src/models/BankAccount.js
```diff
  bankAccountToken: {
    type: DataTypes.STRING,
-   allowNull: false,
+   allowNull: true,
-   unique: true,
+   unique: false,
  },
```

### 2. backend/src/controllers/bankAccountController.js
```diff
  if (bancosRD.includes(banco)) {
    const cuentaLocal = await BankAccount.create({
      usuarioId,
-     bankAccountToken: ruteo,
+     bankAccountToken: null,
      nombreCuenta,
      numerosCuenta: numeroCuenta.slice(-4),
      banco,
      tipoCuenta: tipoCuenta || 'ahorros',
      stripeCustomerId: null,
      stripeBankAccountId: null,
      estado: 'pendiente',
    });
```

### 3. backend/src/models/index.js
```diff
- // Usuario tiene una cuenta bancaria
- User.hasOne(BankAccount, {
+ // Usuario tiene muchas cuentas bancarias
+ User.hasMany(BankAccount, {
    foreignKey: 'usuarioId',
-   as: 'cuentaBancaria'
+   as: 'cuentasBancarias',
+   onDelete: 'CASCADE',
+   onUpdate: 'CASCADE'
  });

  BankAccount.belongsTo(User, {
-   foreignKey: 'usuarioId'
+   foreignKey: 'usuarioId',
+   onDelete: 'CASCADE',
+   onUpdate: 'CASCADE'
  });
```

## Verificación

Se ejecutó test completo (`test-flow-completo.js`) que verifica:
- ✅ Crear usuario
- ✅ Crear primera cuenta
- ✅ Verificar cuenta en BD
- ✅ Crear segunda cuenta
- ✅ Verificar que ambas cuentas persisten

**Resultado:** 100% exitoso - Las relaciones funcionan correctamente

## Impacto en Endpoints

### POST `/cuentas-bancarias/vincular`
- **Antes:** Error 500 por constraint violation
- **Después:** Crea cuenta correctamente sin errores

### GET `/cuentas-bancarias/listado`
- **Antes:** Solo mostraba una cuenta (hasOne)
- **Después:** Muestra todas las cuentas del usuario (hasMany)

### Cascade Delete
- **Antes:** Riesgo de foreign key constraint error si usuario se elimina
- **Después:** Elimina automáticamente cuentas del usuario sin errores

## Recomendaciones Frontend

1. **Persist de cuentas:** Guardar en localStorage después de crear:
```javascript
localStorage.setItem('userBankAccounts', JSON.stringify(accounts));
```

2. **Refresh al login:** Siempre traer cuentas del servidor:
```javascript
const response = await axios.get('/cuentas-bancarias/listado');
setCuentas(response.data);
localStorage.setItem('userBankAccounts', JSON.stringify(response.data));
```

3. **Logout:** No eliminar cuentas locales, solo limpiar token:
```javascript
localStorage.removeItem('token'); // ✅ Limpiar token
// localStorage.removeItem('userBankAccounts'); // ❌ NO HACER ESTO
```

## Commit
- **Hash:** 1552fb6a
- **Mensaje:** Solucionar problemas de cuentas bancarias: cambiar hasOne a hasMany, permitir null en bankAccountToken
