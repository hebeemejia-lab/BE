# 🚀 Guía de Inicio de Servicios - Banco Exclusivo

## Opciones para mantener servicios corriendo

### 1. **Docker Compose (RECOMENDADO - Mejor para desarrollo)**

La opción más práctica. Todo está containerizado y se reinicia automáticamente.

#### Requisitos:
- Docker Desktop instalado (https://www.docker.com/products/docker-desktop)

#### Iniciar:
```bash
# Windows (PowerShell)
.\start.ps1

# Linux/Mac
chmod +x start.sh
./start.sh

# O manualmente
docker-compose up -d
```

#### Servicios que se inician:
- ✅ Backend Node.js en puerto 5000
- ✅ Frontend React en puerto 3000
- ✅ PostgreSQL Database en puerto 5432
- ✅ Adminer (UI para DB) en puerto 8080

#### Ver logs:
```bash
docker-compose logs -f
docker-compose logs -f backend  # Solo backend
docker-compose logs -f frontend # Solo frontend
```

#### Detener:
```bash
docker-compose down
```

#### Reiniciar un servicio específico:
```bash
docker-compose restart backend
docker-compose restart frontend
```

---

### 2. **PM2 (Para desarrollo sin Docker)**

Gestor de procesos que reinicia automáticamente los servicios.

#### Instalar:
```bash
npm install -g pm2
```

#### Configurar:
```bash
# En la carpeta raíz del proyecto
# Ya existe ecosystem.config.js
```

#### Iniciar:
```bash
pm2 start ecosystem.config.js
pm2 logs
```

#### Ver estado:
```bash
pm2 status
pm2 monit  # Monitor en tiempo real
```

#### Detener:
```bash
pm2 stop all
pm2 delete all
```

---

### 3. **Nodemon (Para desarrollo local puro)**

Auto-reinicia el servidor cuando detecta cambios en el código.

#### Instalar (Backend):
```bash
cd backend
npm install --save-dev nodemon
```

#### Actualizar package.json:
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

#### Ejecutar:
```bash
npm run dev
```

#### Ejecutar Frontend:
```bash
cd frontend
npm start  # Ya tiene auto-reload incluido en React
```

---

### 4. **Systemd (Para Linux/Producción)**

Servicios del sistema que se reinician automáticamente al reiniciar.

#### Backend:
```bash
sudo nano /etc/systemd/system/banco-exclusivo-backend.service
```

```ini
[Unit]
Description=Banco Exclusivo Backend
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/home/tu-usuario/Banco Exclusivo/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Activar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable banco-exclusivo-backend
sudo systemctl start banco-exclusivo-backend
sudo systemctl status banco-exclusivo-backend
```

---

## Comparación de Opciones

| Opción | Desarrollo | Producción | Fácil | Aislamiento |
|--------|-----------|-----------|-------|------------|
| Docker Compose | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| PM2 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Nodemon | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Systemd | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Recomendación por Caso de Uso

### Desarrollo Local Rápido:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Desarrollo Reproducible (SIN instalar nada):
```bash
docker-compose up -d
# Visita http://localhost:3000
```

### Testing en Staging:
```bash
pm2 start ecosystem.config.js
pm2 logs
```

### Producción:
```bash
# Usar systemd + PM2 + Nginx + SSL
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

---

## Troubleshooting

### Los servicios se caen:
1. Revisar logs: `docker-compose logs -f`
2. Verificar puertos: `docker ps`
3. Asegurarse de tener suficiente RAM

### Error de puerto en uso:
```bash
# Encontrar qué proceso usa el puerto
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Matar proceso
# Windows
taskkill /PID 1234 /F

# Linux/Mac
kill -9 1234
```

### Cambios en código no se reflejan:
1. Si usas Docker: Los cambios se actualizan automáticamente (volumes configurados)
2. Si usas Nodemon: El servidor debe reiniciarse automáticamente
3. Si usas PM2: Reiniciar con `pm2 restart`

---

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
nano .env  # Editar con tus credenciales
```

Credenciales necesarias:
- `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`
- `JWT_SECRET`
- `DATABASE_URL` (opcional - para PostgreSQL)

---

## Health Checks

Verificar que todo está funcionando:

```bash
# Backend
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000

# Database (si usas Docker)
curl http://localhost:8080
```

Respuesta esperada:
```json
{
  "mensaje": "✓ Banco Exclusivo Backend - Servidor en línea",
  "timestamp": "2026-01-31T..."
}
```
