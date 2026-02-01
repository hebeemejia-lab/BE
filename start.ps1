# Script para iniciar todos los servicios con Docker Compose (Windows)

Write-Host "🚀 Iniciando Banco Exclusivo..." -ForegroundColor Green
Write-Host ""

# Verificar si Docker está instalado
$dockerInstalled = $null
try {
    docker --version | Out-Null
    $dockerInstalled = $true
} catch {
    $dockerInstalled = $false
}

if (-not $dockerInstalled) {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    Write-Host "Descárgalo en: https://www.docker.com/products/docker-desktop"
    exit 1
}

# Copiar .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "📋 Creando archivo .env desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Por favor, edita .env con tus credenciales" -ForegroundColor Yellow
    Read-Host "Presiona Enter para continuar"
}

# Iniciar servicios
Write-Host ""
Write-Host "📦 Construyendo imágenes e iniciando servicios..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Servicios iniciados correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URLs disponibles:" -ForegroundColor Cyan
    Write-Host "   - Backend: http://localhost:5000" -ForegroundColor White
    Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   - Adminer (DB): http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Comandos útiles:" -ForegroundColor Cyan
    Write-Host "   Ver logs:        docker-compose logs -f" -ForegroundColor Gray
    Write-Host "   Detener:         docker-compose down" -ForegroundColor Gray
    Write-Host "   Reiniciar:       docker-compose restart" -ForegroundColor Gray
    Write-Host "   Estado:          docker-compose ps" -ForegroundColor Gray
    Write-Host ""
    
    # Abrir navegador
    Write-Host "🌍 Abriendo navegador..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} else {
    Write-Host "❌ Error iniciando servicios" -ForegroundColor Red
    exit 1
}
