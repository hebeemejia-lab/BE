# 💳 Guía de Integración - Carter Card

## ¿Qué es Carter Card?

Carter Card es una plataforma de pagos que permite realizar transferencias y pagos digitales. En Banco Exclusivo, está integrada para que los usuarios puedan hacer transferencias utilizando su tarjeta Carter Card.

## 📋 Configuración

### 1. Obtener credenciales de Carter Card

1. Visita [Carter Card](https://cartercard.com) o la plataforma correspondiente
2. Crea una cuenta de desarrollador
3. Genera tus claves API
4. Copia tu `API_KEY`

### 2. Actualizar el .env

En el archivo `backend/.env`, actualiza:

```env
CARTER_CARD_API=https://api.cartercard.com
CARTER_CARD_KEY=tu_api_key_aqui
```

## 🚀 Cómo usar Carter Card en el Frontend

### Opción 1: Transferencia con Carter Card a otro usuario

```javascript
// En la página de transferencias
const { data } = await fetch('http://localhost:5000/api/carter-card/transferir', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    numeroTarjeta: '4532123456789012', // Número de tarjeta Carter Card
    monto: 500,
    concepto: 'Pago de servicios',
    cedula_destinatario: '1234567890', // Cedula del receptor (opcional)
  }),
});
```

### Opción 2: Pago sin transferencia bancaria

```javascript
const { data } = await fetch('http://localhost:5000/api/carter-card/transferir', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    numeroTarjeta: '4532123456789012',
    monto: 100,
    concepto: 'Compra de productos',
  }),
});
```

## 📊 Endpoints disponibles

### POST `/api/carter-card/transferir`

Procesa un pago o transferencia con Carter Card

**Parámetros requeridos:**
- `numeroTarjeta` (string): Número de la tarjeta Carter Card
- `monto` (number): Cantidad a transferir
- `concepto` (string): Descripción de la transacción
- `cedula_destinatario` (string, opcional): Si es transferencia a otro usuario

**Respuesta exitosa:**
```json
{
  "mensaje": "Transferencia realizada exitosamente con Carter Card",
  "transferencia": {
    "id": 1,
    "monto": 500,
    "destinatario": "Juan Pérez",
    "numeroReferencia": "CARTER-1705525200123",
    "tarjetaUltimos4": "9012",
    "fecha": "2026-01-18T20:00:00.000Z"
  }
}
```

### GET `/api/carter-card/historial`

Obtiene el historial de transacciones con Carter Card

**Parámetros:**
- Requiere token de autenticación

## 🔒 Seguridad

**Importante:**
- NUNCA guardes números de tarjeta completos en la base de datos
- Solo se guardan los últimos 4 dígitos para referencia
- Todos los pagos se procesan a través de la API segura de Carter Card
- Los datos se encriptan en tránsito

## 🐛 Solución de problemas

### Error: "Número de tarjeta inválido"
- Verifica que el número tenga al menos 10 dígitos
- Asegúrate de que el formato sea correcto

### Error: "API Key inválida"
- Verifica tu `.env` con las credenciales correctas
- Comprueba que la API Key no haya expirado

### Error: "Conexión rechazada"
- Verifica que tengas acceso a internet
- Comprueba que la URL de la API sea correcta

## 📝 Ejemplo de integración en componente React

```jsx
import { useState } from 'react';
import axios from 'axios';

export default function CarterCardTransfer() {
  const [tarjeta, setTarjeta] = useState('');
  const [monto, setMonto] = useState('');
  const [estado, setEstado] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/api/carter-card/transferir',
        {
          numeroTarjeta: tarjeta,
          monto: parseFloat(monto),
          concepto: 'Transferencia desde Carter Card',
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setEstado(`¡Éxito! Referencia: ${response.data.transferencia.numeroReferencia}`);
    } catch (error) {
      setEstado(`Error: ${error.response?.data?.error}`);
    }
  };

  return (
    <form onSubmit={handleTransfer}>
      <input
        type="text"
        placeholder="Número de tarjeta"
        value={tarjeta}
        onChange={(e) => setTarjeta(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />
      <button type="submit">Transferir con Carter Card</button>
      {estado && <p>{estado}</p>}
    </form>
  );
}
```

## 📞 Próximos pasos

1. **Integrar API real de Carter Card**: Reemplaza las funciones mock en `services/carterCardService.js` con llamadas reales
2. **Añadir validación avanzada**: PCI DSS compliance
3. **Implementar webhooks**: Para confirmaciones en tiempo real
4. **Añadir récaudos**: Verificación de saldo disponible

---

**¿Preguntas?** Consulta la [documentación de Carter Card](https://developers.cartercard.com)
