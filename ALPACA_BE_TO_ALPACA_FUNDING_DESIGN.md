# Diseño de Funding Real BE -> Alpaca

## Estado actual del repositorio

Hoy el repositorio ya puede:

- Buscar pares crypto reales de Alpaca.
- Cotizar crypto con market data real.
- Ejecutar compras crypto reales contra Alpaca Trading API.

Hoy el repositorio no puede fondear Alpaca de forma real desde Banco Exclusivo porque faltan piezas obligatorias de Broker API y ACH:

- No existe un `alpacaAccountId` por usuario en el modelo de usuario.
- No existe un `achRelationshipId` persistido por cuenta bancaria.
- La cuenta bancaria local solo guarda ultimos 4 digitos, no numero completo ni routing utilizable para Alpaca.
- El flujo actual de cuentas bancarias simula ACH localmente.
- No existe reconciliacion por eventos de funding de Alpaca.

## Hallazgos concretos del codigo

### Modelo de usuario

El modelo actual no guarda identificador de cuenta Broker/Trading de Alpaca:

- `backend/src/models/User.js`

Campos faltantes minimos:

- `alpacaAccountId`
- `alpacaAccountStatus`
- `alpacaAchEnabledAt`

### Modelo de cuenta bancaria

El modelo actual no sirve para funding real BE -> Alpaca porque solo guarda informacion parcial:

- `backend/src/models/BankAccount.js`

Problemas:

- `numerosCuenta` solo guarda ultimos 4 digitos.
- No existe `routingNumber` persistido.
- No existe `accountOwnerName` normalizado para Broker API.
- No existe `alpacaAchRelationshipId`.
- No existe estado de funding ACH independiente del estado local.

Campos faltantes minimos:

- `routingNumber`
- `accountHolderName`
- `alpacaAchRelationshipId`
- `alpacaAchRelationshipStatus`
- `alpacaProcessorToken`
- `fundingSource` con valores `plaid` o `manual`

### Controlador de cuentas bancarias

El flujo actual sigue siendo simulado:

- `backend/src/controllers/bankAccountController.js`

Señales claras:

- La verificacion usa microdepositos simulados.
- La recarga desde banco marca una recarga exitosa despues de un `setTimeout`.
- El comentario actual ya dice que en produccion aqui iria Stripe ACH.

### Servicio de Alpaca

El servicio actual solo documenta funding y retiro, pero no los ejecuta:

- `backend/src/services/alpacaService.js`

Las funciones `transferirFondosAAlpaca` y `retirarFondosDeAlpaca` devuelven mensajes de configuracion adicional en lugar de operar contra Broker API.

## Prerrequisitos exactos que faltan

### 1. Cuenta Alpaca por usuario

Para funding real con Broker API hace falta un `account_id` por usuario.

Sin eso no se puede llamar a:

- `POST /v1/accounts/{account_id}/ach_relationships`
- `POST /v1/accounts/{account_id}/transfers`

El repo actual usa Trading API compartida por credenciales globales, no cuentas broker individuales.

### 2. Integracion de ACH compatible con Alpaca

Alpaca ACH Funding exige una de estas dos entradas:

- `processor_token` de Plaid para Alpaca
- o datos completos de cuenta bancaria USA: owner name, routing, account number, tipo

El repo actual no tiene:

- integracion Plaid
- cuenta bancaria USA validada para cada usuario
- almacenamiento de routing/account number completos

### 3. Elegibilidad regulatoria y KYC

Antes de fondear una cuenta broker real, el usuario debe tener una cuenta Alpaca aprobada y apta para funding ACH.

Hace falta persistir y verificar:

- estado de onboarding Alpaca
- estado KYC/KYB si aplica
- jurisdiccion elegible para crypto y funding
- aprobacion para ACH

### 4. Reconciliacion asincrona

El funding ACH no debe acreditarse como saldo util inmediato en BE solo por solicitar la transferencia.

Hace falta:

- tabla o modelo de `FundingTransfer`
- estados: `requested`, `pending`, `queued`, `settled`, `failed`, `canceled`
- webhook o SSE consumer para eventos de Alpaca
- reconciliacion nocturna o reintento por polling

### 5. Separacion de ledgers

Ahora mismo BE usa `User.saldo` como saldo local. Para funding real hacen falta al menos dos saldos separados:

- `saldoBEDisponible`
- `saldoEnTransitoAlpaca`

Opcionalmente:

- `saldoBrokerConfirmado`

Sin esta separacion hay riesgo de doble gasto o de acreditar fondos antes de settlement.

## APIs reales que deben usarse

### Crear relacion ACH

Referencia Alpaca Broker API:

- `POST /v1/accounts/{account_id}/ach_relationships`

Campos relevantes:

- `account_owner_name`
- `bank_account_type`
- `bank_account_number`
- `bank_routing_number`

Alternativa recomendada:

- usar `processor_token` de Plaid para no manejar cuenta/routing en claro mas tiempo del necesario

### Crear funding transfer

Referencia Alpaca Broker API:

- `POST /v1/accounts/{account_id}/transfers`

Campos relevantes:

- `transfer_type: ach`
- `relationship_id`
- `amount`
- `direction: INCOMING`
- `timing: immediate`

Nota importante:

- en produccion Alpaca no ofrece el mismo comportamiento instantaneo de sandbox para ACH; el settlement sigue siendo asincrono.

## Diseño propuesto por fases

### Fase 1. Preparacion de datos

Cambios de modelo:

- agregar a `User`:
  - `alpacaAccountId`
  - `alpacaAccountStatus`
- agregar a `BankAccount`:
  - `routingNumber`
  - `accountHolderName`
  - `alpacaAchRelationshipId`
  - `alpacaAchRelationshipStatus`
  - `alpacaProcessorToken`
- crear modelo `FundingTransfer` con:
  - `usuarioId`
  - `bankAccountId`
  - `alpacaAccountId`
  - `alpacaTransferId`
  - `alpacaRelationshipId`
  - `amount`
  - `direction`
  - `status`
  - `provider`
  - `metadata`

### Fase 2. Vinculacion bancaria real

Ruta sugerida:

- `POST /cuentas-bancarias/alpaca/vincular`

Flujo recomendado:

1. Usuario conecta banco con Plaid Link.
2. Backend intercambia `public_token` por `access_token`.
3. Backend crea `processor_token` para Alpaca.
4. Backend llama a Alpaca `ach_relationships`.
5. Backend persiste `alpacaAchRelationshipId`.

### Fase 3. Funding BE -> Alpaca

Ruta sugerida:

- `POST /funding/alpaca/depositar`

Reglas:

1. Validar usuario autenticado.
2. Validar `alpacaAccountId` activo.
3. Validar `alpacaAchRelationshipId` activo.
4. Validar saldo BE suficiente.
5. Debitar saldo BE hacia `saldoEnTransitoAlpaca`.
6. Crear `FundingTransfer` local en `requested`.
7. Llamar a Alpaca `transfers` con `direction: INCOMING`.
8. Guardar `alpacaTransferId` y pasar a `pending`.
9. Confirmar settlement por evento/polling.
10. Solo al confirmar settlement marcar disponible para trading.

### Fase 4. Reconciliacion

Fuentes de verdad:

- estado de transfer local
- estado de transfer Alpaca
- buying power real de la cuenta

Nunca usar una sola de esas tres fuentes aislada.

## Criterios minimos para llamar esto produccion

- Cuenta Alpaca individual por usuario.
- ACH relationship real por usuario.
- Funding transfer real persistido con id externo.
- Reconciliacion asincrona de settlement.
- Ledger BE separado de fondos en transito.
- Trazabilidad para auditoria.

## Lo que NO conviene hacer

- No reutilizar `stripeBankAccountId` como si fuera identificador Alpaca.
- No acreditar saldo de trading instantaneamente solo porque la solicitud ACH salio bien.
- No mezclar cuenta bancaria local RD con una relacion ACH USA sin validar compatibilidad.
- No usar la cuenta trading global compartida como si fuera una cuenta broker por usuario.

## Siguiente implementacion recomendable

Orden pragmatica:

1. Agregar `alpacaAccountId` al usuario.
2. Crear modelo `FundingTransfer`.
3. Integrar Plaid processor token para Alpaca.
4. Crear ruta de vinculacion ACH real.
5. Crear ruta de funding real con transfer local + Broker API.
6. Agregar reconciliacion por polling o SSE.

## Conclusión

El repositorio ya esta listo para comprar crypto real si la cuenta Alpaca ya tiene buying power.

El gap restante no es un simple endpoint faltante. Es una integracion Broker API completa con:

- cuenta Alpaca por usuario
- vinculacion ACH real
- transferencias asincronas
- reconciliacion contable

Sin esas piezas, cualquier intento de "funding automatico" seria solo otra simulacion.