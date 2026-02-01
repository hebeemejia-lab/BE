# Script para iniciar Banco Exclusivo con Docker Compose

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🏦 BANCO EXCLUSIVO - DOCKER COMPOSE     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no encontrado. Descárgalo en:" -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Crear .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "📋 Creando archivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  IMPORTANTE: Edita .env con tus credenciales reales:" -ForegroundColor Yellow
    Write-Host "   - PAYPAL_CLIENT_ID" -ForegroundColor Gray
    Write-Host "   - PAYPAL_CLIENT_SECRET" -ForegroundColor Gray
    Write-Host "   - RAPYD_ACCESS_KEY / RAPYD_SECRET_KEY" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📂 Abriendo archivo .env..." -ForegroundColor Cyan
    Start-Process "notepad" ".env"
    Write-Host ""
    Read-Host "⏳ Presiona Enter cuando hayas guardado los cambios"
    Write-Host ""
}

# Construir y levantar servicios
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Cyan
Write-Host ""

docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Servicios iniciados exitosamente!" -ForegroundColor Green
Write-Host ""

# Esperar a que backend esté listo
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar salud
Write-Host "🔍 Verificando salud de servicios..." -ForegroundColor Yellow
$maxRetries = 10
$retries = 0

while ($retries -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend operativo" -ForegroundColor Green
            break
        }
    } catch {
        $retries++
        if ($retries -lt $maxRetries) {
            Write-Host "⏳ Esperando backend... ($retries/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            🌐 ACCESO A SERVICIOS          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎨 Frontend:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "⚙️  Backend:         http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 Health Check:    http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║          📚 COMANDOS ÚTILES              ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "Ver logs (todos):         docker-compose logs -f" -ForegroundColor Gray
Write-Host "Ver logs (backend):       docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "Ver logs (frontend):      docker-compose logs -f frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "Ver estado:               docker-compose ps" -ForegroundColor Gray
Write-Host "Reiniciar backend:        docker-compose restart backend" -ForegroundColor Gray
Write-Host "Detener servicios:        docker-compose down" -ForegroundColor Gray
Write-Host "Limpiar volúmenes:        docker-compose down -v" -ForegroundColor Gray
Write-Host ""

Write-Host "🌍 Abriendo navegador..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✨ ¡Listo! Usa 'docker-compose logs -f' para ver los logs" -ForegroundColor Green
Write-Host ""
