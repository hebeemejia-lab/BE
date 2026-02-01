# Script para controlar servicios Docker Compose

param(
    [string]$Command = "status"
)

Write-Host ""
Write-Host "🐳 CONTROL - Banco Exclusivo Docker Compose" -ForegroundColor Cyan
Write-Host ""

switch ($Command.ToLower()) {
    "start" {
        Write-Host "▶️  Iniciando servicios..." -ForegroundColor Green
        docker-compose up -d
    }
    "stop" {
        Write-Host "⏹️  Deteniendo servicios..." -ForegroundColor Yellow
        docker-compose down
    }
    "restart" {
        Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Cyan
        docker-compose restart
        Write-Host "✅ Servicios reiniciados" -ForegroundColor Green
    }
    "restart-backend" {
        Write-Host "🔄 Reiniciando backend..." -ForegroundColor Cyan
        docker-compose restart backend
        Write-Host "✅ Backend reiniciado" -ForegroundColor Green
    }
    "restart-frontend" {
        Write-Host "🔄 Reiniciando frontend..." -ForegroundColor Cyan
        docker-compose restart frontend
        Write-Host "✅ Frontend reiniciado" -ForegroundColor Green
    }
    "status" {
        Write-Host "📊 Estado de servicios:" -ForegroundColor Cyan
        Write-Host ""
        docker-compose ps
    }
    "clean" {
        Write-Host "🧹 Limpiando volúmenes y contenedores..." -ForegroundColor Yellow
        Write-Host "⚠️  Esto elimina la base de datos" -ForegroundColor Red
        $confirm = Read-Host "¿Estás seguro? (s/n)"
        if ($confirm -eq "s") {
            docker-compose down -v
            Write-Host "✅ Limpieza completada" -ForegroundColor Green
        } else {
            Write-Host "❌ Cancelado" -ForegroundColor Yellow
        }
    }
    "health" {
        Write-Host "🔍 Verificando salud de servicios..." -ForegroundColor Cyan
        Write-Host ""
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Backend: OPERATIVO" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Backend: NO RESPONDE" -ForegroundColor Red
        }
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend: OPERATIVO" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Frontend: NO RESPONDE" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "URLs:" -ForegroundColor Yellow
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Gray
        Write-Host "  Backend:   http://localhost:5000" -ForegroundColor Gray
    }
    default {
        Write-Host "Uso: .\service.ps1 [comando]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Comandos disponibles:" -ForegroundColor Yellow
        Write-Host "  start              - Iniciar servicios" -ForegroundColor Gray
        Write-Host "  stop               - Detener servicios" -ForegroundColor Gray
        Write-Host "  restart            - Reiniciar todos los servicios" -ForegroundColor Gray
        Write-Host "  restart-backend    - Reiniciar solo backend" -ForegroundColor Gray
        Write-Host "  restart-frontend   - Reiniciar solo frontend" -ForegroundColor Gray
        Write-Host "  status             - Ver estado de servicios" -ForegroundColor Gray
        Write-Host "  health             - Verificar salud de servicios" -ForegroundColor Gray
        Write-Host "  clean              - Limpiar volúmenes (¡elimina datos!)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Ejemplos:" -ForegroundColor Yellow
        Write-Host "  .\service.ps1 start" -ForegroundColor Gray
        Write-Host "  .\service.ps1 restart-backend" -ForegroundColor Gray
        Write-Host "  .\service.ps1 status" -ForegroundColor Gray
    }
}

Write-Host ""
