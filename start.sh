#!/bin/bash
# Script para iniciar todos los servicios con Docker Compose

echo "🚀 Iniciando Banco Exclusivo..."
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    echo "Descárgalo en: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar si docker-compose está disponible
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Usando docker compose (nueva versión)"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Copiar .env si no existe
if [ ! -f .env ]; then
    echo "📋 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  Por favor, edita .env con tus credenciales"
    read -p "Presiona Enter para continuar..."
fi

# Iniciar servicios
echo ""
echo "📦 Construyendo imágenes y iniciando servicios..."
$DOCKER_COMPOSE up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Servicios iniciados correctamente!"
    echo ""
    echo "🌐 URLs disponibles:"
    echo "   - Backend: http://localhost:5000"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Adminer (DB): http://localhost:8080"
    echo ""
    echo "📊 Comandos útiles:"
    echo "   Ver logs:        $DOCKER_COMPOSE logs -f"
    echo "   Detener:         $DOCKER_COMPOSE down"
    echo "   Reiniciar:       $DOCKER_COMPOSE restart"
    echo "   Estado:          $DOCKER_COMPOSE ps"
    echo ""
else
    echo "❌ Error iniciando servicios"
    exit 1
fi
