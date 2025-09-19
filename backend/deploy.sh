#!/bin/bash

# Script de despliegue para Twenty One Pilots API
# Uso: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="twentyonepilots-backend"

echo "🚀 Iniciando despliegue de $PROJECT_NAME en $ENVIRONMENT"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio backend"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --only=production

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p logs/pm2
mkdir -p uploads
mkdir -p public

# Verificar variables de entorno
echo "🔧 Verificando configuración..."
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -z "$MONGO_URI" ]; then
        echo "⚠️  Advertencia: MONGO_URI no configurada"
    fi
    if [ -z "$JWT_SECRET" ]; then
        echo "⚠️  Advertencia: JWT_SECRET no configurada"
    fi
fi

# Ejecutar tests si no estamos en producción
if [ "$ENVIRONMENT" != "production" ]; then
    echo "🧪 Ejecutando tests..."
    npm test
fi

# Detener aplicación existente
echo "🛑 Deteniendo aplicación existente..."
pm2 delete $PROJECT_NAME 2>/dev/null || echo "No había aplicación ejecutándose"

# Iniciar aplicación con PM2
echo "▶️  Iniciando aplicación..."
if [ "$ENVIRONMENT" = "production" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env development
fi

# Guardar configuración de PM2
pm2 save

# Mostrar status
echo "📊 Status de la aplicación:"
pm2 status
pm2 logs $PROJECT_NAME --lines 10

echo "✅ Despliegue completado exitosamente!"
echo "🌐 API disponible en: http://localhost:5000"
echo "📚 Documentación: http://localhost:5000/api-docs"
echo ""
echo "📋 Comandos útiles:"
echo "  pm2 restart $PROJECT_NAME    # Reiniciar aplicación"
echo "  pm2 stop $PROJECT_NAME       # Detener aplicación"
echo "  pm2 logs $PROJECT_NAME       # Ver logs"
echo "  pm2 monit                    # Monitor de recursos"