# 🏦 Banco Exclusivo - Plataforma de Transferencias y Préstamos

Una aplicación web completa para gestionar transferencias bancarias y solicitudes de préstamos con un diseño moderno en azul y rojo.

## 📋 Características

### Backend (Node.js + Express)
- ✅ Autenticación JWT segura
- ✅ API REST completa
- ✅ Gestión de usuarios
- ✅ Transferencias bancarias
- ✅ Sistema de préstamos
- ✅ Historial de transacciones
- ✅ Base de datos MongoDB

### Frontend (React)
- ✅ Diseño hermoso con tema azul y rojo
- ✅ Interfaz responsiva
- ✅ Dashboard intuitivo
- ✅ Formularios de transferencias
- ✅ Solicitud de préstamos
- ✅ Historial completo
- ✅ Autenticación segura

## 🚀 Instalación

### Requisitos previos
- Node.js (v14 o superior)
- MongoDB (local o atlas)
- NPM o Yarn

### 1. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta backend:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/banco-exclusivo
JWT_SECRET=tu_clave_secreta_super_segura_2024
NODE_ENV=development
```

Iniciar MongoDB (si está en local):
```bash
mongod
```

Iniciar servidor backend:
```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:5000`

### 2. Configurar Frontend

```bash
cd frontend
npm install
```

Iniciar servidor frontend:
```bash
npm start
```

La aplicación estará disponible en: `http://localhost:3000`

## 📚 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil (requiere autenticación)

### Transferencias
- `POST /api/transferencias/realizar` - Realizar transferencia
- `GET /api/transferencias/historial` - Obtener historial
- `GET /api/transferencias/enviadas` - Transferencias enviadas
- `GET /api/transferencias/recibidas` - Transferencias recibidas

### Préstamos
- `POST /api/prestamos/solicitar` - Solicitar préstamo
- `GET /api/prestamos/mis-prestamos` - Mis préstamos
- `GET /api/prestamos/todos` - Todos los préstamos (admin)
- `POST /api/prestamos/aprobar` - Aprobar préstamo (admin)
- `POST /api/prestamos/rechazar` - Rechazar préstamo (admin)

## 🎨 Paleta de Colores

- **Azul Oscuro**: #001a4d
- **Azul Claro**: #003d99
- **Rojo**: #cc0000
- **Rojo Claro**: #ff3333
- **Blanco**: #ffffff
- **Gris**: #f5f5f5

## 📁 Estructura del Proyecto

```
Banco Exclusivo/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── transferController.js
│   │   │   └── loanController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Transfer.js
│   │   │   └── Loan.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── transferRoutes.js
│   │   │   └── loanRoutes.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── Navbar.css
    │   │   └── ProtectedRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Home.css
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Auth.css
    │   │   ├── Dashboard.js
    │   │   ├── Dashboard.css
    │   │   ├── Transferencias.js
    │   │   ├── Transferencias.css
    │   │   ├── Prestamos.js
    │   │   └── Prestamos.css
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   └── global.css
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## 🔐 Seguridad

- Contraseñas hasheadas con bcryptjs
- Tokens JWT para autenticación
- CORS habilitado
- Validación de entrada
- Protección de rutas

## 📱 Responsividad

La aplicación es totalmente responsiva y funciona en:
- Desktops
- Tablets
- Dispositivos móviles

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Bcryptjs
- CORS
- Body-parser

### Frontend
- React
- React Router
- Axios
- CSS3
- Context API

## 📝 Ejemplo de Uso

1. **Registrarse**: Crear una nueva cuenta con datos personales
2. **Login**: Iniciar sesión con email y contraseña
3. **Transferencias**: Enviar dinero a otros usuarios por su cédula
4. **Préstamos**: Solicitar un préstamo con diferentes plazos
5. **Dashboard**: Ver tu saldo y historial completo

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, crear un pull request con tus mejoras.

## 📄 Licencia

MIT

## 📞 Soporte

Para reportar problemas o sugerencias, contacta con el equipo de desarrollo.

---

**¡Gracias por usar Banco Exclusivo!** 🎉
