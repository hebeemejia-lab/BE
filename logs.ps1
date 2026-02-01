# Script para ver logs de Docker Compose

param(
    [string]$Service = "all"
)

Write-Host ""
Write-Host "📊 LOGS - Banco Exclusivo" -ForegroundColor Cyan
Write-Host ""

if ($Service -eq "all" -or $Service -eq "") {
    Write-Host "Mostrando logs de TODOS los servicios..." -ForegroundColor Yellow
    Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
    Write-Host ""
    docker-compose logs -f
} elseif ($Service -eq "backend") {
    Write-Host "Mostrando logs del BACKEND..." -ForegroundColor Yellow
    Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
    Write-Host ""
    docker-compose logs -f backend
} elseif ($Service -eq "frontend") {
    Write-Host "Mostrando logs del FRONTEND..." -ForegroundColor Yellow
    Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
    Write-Host ""
    docker-compose logs -f frontend
} else {
    Write-Host "Uso: .\logs.ps1 [all|backend|frontend]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ejemplos:" -ForegroundColor Yellow
    Write-Host "  .\logs.ps1              # Ver todos los logs" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 backend      # Ver logs del backend" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 frontend     # Ver logs del frontend" -ForegroundColor Gray
}
