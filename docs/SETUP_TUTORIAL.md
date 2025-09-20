# 🚀 Tutorial de Configuración - Twenty One Pilots

## 📋 Visión General

Este tutorial te guiará paso a paso para configurar tu entorno de desarrollo local para contribuir al proyecto Twenty One Pilots. Cubriremos desde la instalación básica hasta configuraciones avanzadas.

## 🎯 Objetivos de Aprendizaje

Al final de este tutorial podrás:
- ✅ Configurar un entorno de desarrollo completo
- ✅ Ejecutar la aplicación localmente
- ✅ Realizar cambios y probarlos
- ✅ Contribuir al proyecto siguiendo las mejores prácticas

## 📋 Prerrequisitos

### Conocimientos Requeridos
- ✅ Conceptos básicos de JavaScript/Node.js
- ✅ Fundamentos de React
- ✅ Conocimientos básicos de Git
- ✅ Familiaridad con terminal/command line

### Hardware Mínimo Recomendado
- **RAM**: 8GB mínimo, 16GB recomendado
- **CPU**: Dual-core mínimo, Quad-core recomendado
- **Almacenamiento**: 10GB de espacio libre
- **SO**: Windows 10/11, macOS 12+, Ubuntu 20.04+

---

## 🛠️ Instalación Paso a Paso

### Paso 1: Instalar Node.js y npm

#### Opción A: Instalación Directa (Recomendado)

```bash
# Verificar instalación existente
node --version
npm --version

# Si no está instalado, descargar desde:
# https://nodejs.org/ (versión LTS recomendada: 18.x)
```

#### Opción B: Usando nvm (Node Version Manager)

```bash
# Instalar nvm (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar nvm (Windows)
# Descargar desde: https://github.com/coreybutler/nvm-windows/releases

# Instalar Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 8.x.x
```

### Paso 2: Instalar Git

```bash
# Verificar instalación
git --version

# Si no está instalado:
# Windows: https://git-scm.com/download/win
# macOS: brew install git
# Ubuntu: sudo apt-get install git
```

### Paso 3: Instalar Docker (Opcional pero recomendado)

```bash
# Verificar instalación
docker --version
docker-compose --version

# Si no está instalado:
# https://docs.docker.com/get-docker/
```

### Paso 4: Instalar Editor de Código

#### Opción A: Visual Studio Code (Recomendado)

```bash
# Descargar e instalar desde:
# https://code.visualstudio.com/

# Extensiones recomendadas:
# - ES7+ React/Redux/React-Native snippets
# - Prettier - Code formatter
# - ESLint
# - Docker
# - GitLens
# - MongoDB for VS Code
```

#### Opción B: Otros Editores
- WebStorm
- Sublime Text
- Atom

---

## 📥 Clonación y Configuración del Proyecto

### Paso 1: Clonar el Repositorio

```bash
# Crear directorio de proyectos
mkdir ~/projects
cd ~/projects

# Clonar el repositorio
git clone https://github.com/twentyonepilots/app.git
cd app

# Verificar estructura
ls -la
```

### Paso 2: Configurar Variables de Entorno

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Editar backend/.env
nano backend/.env
```

**Contenido de `backend/.env`:**
```bash
# Entorno
NODE_ENV=development
PORT=5000

# Base de datos
MONGO_URI=mongodb://localhost:27017/twentyonepilots_dev

# Cache
REDIS_URL=redis://localhost:6379

# Autenticación
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=24h

# APIs externas
YOUTUBE_API_KEY=your_youtube_api_key_here
EVENTBRITE_API_KEY=your_eventbrite_api_key_here

# Email (opcional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL=300
```

**Contenido de `frontend/.env`:**
```bash
# API
REACT_APP_API_URL=http://localhost:5000/api/v2

# Entorno
REACT_APP_ENVIRONMENT=development

# Analytics (opcional)
REACT_APP_GA_TRACKING_ID=your_ga_tracking_id

# PWA
REACT_APP_PWA_ENABLED=true
```

### Paso 3: Instalar Dependencias

```bash
# Instalar dependencias del backend
cd backend
npm ci

# Instalar dependencias del frontend
cd ../frontend
npm ci

# Verificar instalación
cd ../backend && npm list --depth=0
cd ../frontend && npm list --depth=0
```

---

## 🐳 Configuración con Docker (Método Recomendado)

### Paso 1: Levantar Servicios con Docker Compose

```bash
# Desde el directorio raíz del proyecto
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps

# Ver logs de los servicios
docker-compose logs -f
```

### Paso 2: Verificar Conexiones

```bash
# Verificar MongoDB
docker exec -it twentyonepilots-mongodb mongosh --eval "db.stats()"

# Verificar Redis
docker exec -it twentyonepilots-redis redis-cli ping

# Verificar Elasticsearch
curl http://localhost:9200/_cluster/health?pretty
```

### Paso 3: Ejecutar la Aplicación

```bash
# Backend
cd backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm start
```

---

## 🔧 Configuración Manual (Sin Docker)

### Paso 1: Instalar MongoDB Local

#### Windows
```bash
# Descargar MongoDB Community Server desde:
# https://www.mongodb.com/try/download/community

# Crear directorio de datos
mkdir C:\data\db

# Iniciar MongoDB
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"

# En otra terminal, crear base de datos
"C:\Program Files\MongoDB\Server\6.0\bin\mongosh.exe"
use twentyonepilots_dev
```

#### macOS
```bash
# Instalar con Homebrew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Verificar
mongosh --eval "db.stats()"
```

#### Ubuntu
```bash
# Instalar MongoDB
sudo apt-get install mongodb

# Iniciar servicio
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verificar
mongosh --eval "db.stats()"
```

### Paso 2: Instalar Redis Local

#### Windows (WSL)
```bash
# Instalar Redis en WSL
sudo apt-get update
sudo apt-get install redis-server

# Iniciar Redis
sudo systemctl start redis-server

# Verificar
redis-cli ping
```

#### macOS
```bash
# Instalar con Homebrew
brew install redis

# Iniciar Redis
brew services start redis

# Verificar
redis-cli ping
```

### Paso 3: Instalar Elasticsearch (Opcional)

```bash
# Descargar desde: https://www.elastic.co/downloads/elasticsearch

# Extraer y ejecutar
./bin/elasticsearch

# Verificar
curl http://localhost:9200/_cluster/health?pretty
```

---

## 🧪 Verificación de la Instalación

### Paso 1: Ejecutar Tests

```bash
# Tests del backend
cd backend
npm test

# Tests del frontend
cd ../frontend
npm test -- --watchAll=false
```

### Paso 2: Verificar Health Checks

```bash
# Health check del backend
curl http://localhost:5000/health

# Health check del frontend
curl http://localhost:3000
```

### Paso 3: Verificar Funcionalidades Básicas

```bash
# Buscar videos (debe devolver resultados de ejemplo)
curl "http://localhost:5000/api/v2/videos/search?q=top"

# Obtener información de versiones
curl http://localhost:5000/api/versions

# Verificar métricas
curl http://localhost:5000/api/metrics
```

---

## 🔧 Desarrollo y Testing

### Flujo de Trabajo Básico

```bash
# 1. Crear rama para tu feature
git checkout develop
git pull origin develop
git checkout -b feature/my-awesome-feature

# 2. Hacer cambios
# Editar archivos...

# 3. Ejecutar tests
cd backend && npm test
cd ../frontend && npm test

# 4. Verificar linting
cd backend && npm run lint
cd ../frontend && npm run lint

# 5. Commit de cambios
git add .
git commit -m "feat: add awesome feature"

# 6. Push de cambios
git push origin feature/my-awesome-feature
```

### Debugging

#### Backend Debugging
```bash
# Ejecutar con debugging habilitado
cd backend
npm run dev:debug

# O usar VS Code debugger
# Crear .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### Frontend Debugging
```bash
# Ejecutar con React DevTools
cd frontend
npm start

# Abrir Chrome DevTools
# Ir a Components tab para ver React components
# Usar Network tab para ver API calls
```

### Logging

```bash
# Ver logs del backend
cd backend
tail -f logs/combined.log

# Ver logs del frontend (en browser console)
# F12 > Console tab

# Ver logs de Docker
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🚀 Despliegue Local Avanzado

### Configuración de HTTPS Local

```bash
# Generar certificados SSL para desarrollo
cd backend/ssl
node generate-dev-certs.js

# Actualizar .env
HTTPS=true
SSL_CERT_PATH=./ssl/certificate.crt
SSL_KEY_PATH=./ssl/private.key
```

### Configuración de Base de Datos de Producción

```bash
# Usar MongoDB Atlas (recomendado para desarrollo)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/twentyonepilots_dev

# O usar MongoDB local con réplica set
MONGO_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/twentyonepilots_dev?replicaSet=rs0
```

### Configuración de Cache Avanzado

```bash
# Redis Cluster (para desarrollo avanzado)
REDIS_URL=redis://localhost:6379,localhost:6380,localhost:6381

# O usar Redis Cloud
REDIS_URL=redis://username:password@host:port
```

---

## 🔧 Solución de Problemas Comunes

### Problema: Puerto ya en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :5000  # Linux/macOS
netstat -ano | findstr :5000  # Windows

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=5001
```

### Problema: Error de conexión a MongoDB

```bash
# Verificar que MongoDB esté corriendo
docker-compose ps mongodb

# Reiniciar MongoDB
docker-compose restart mongodb

# Ver logs
docker-compose logs mongodb
```

### Problema: Tests fallando

```bash
# Limpiar cache de tests
cd backend && npm run test:clean

# Ejecutar tests específicos
npm test -- --testNamePattern="should authenticate user"

# Ver cobertura
npm run test:coverage
```

### Problema: Dependencias corruptas

```bash
# Limpiar node_modules y reinstalar
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Problema: Error de CORS

```bash
# Verificar configuración de CORS en backend
# En middleware/security.js
const corsOptions = {
  origin: process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [process.env.FRONTEND_URL],
  credentials: true
};
```

---

## 📊 Monitoreo y Métricas

### Métricas de Desarrollo

```bash
# Ver métricas del backend
curl http://localhost:5000/api/metrics

# Ver métricas del frontend (en browser)
# http://localhost:3000 -> DevTools -> Performance tab

# Ver logs de rendimiento
cd backend && tail -f logs/performance.log
```

### Health Checks Automatizados

```bash
# Script de health check
#!/bin/bash
echo "🔍 Health Check - $(date)"

# Backend health
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
  echo "✅ Backend: OK"
else
  echo "❌ Backend: FAILED"
fi

# Frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend: OK"
else
  echo "❌ Frontend: FAILED"
fi

# Database health
if docker exec twentyonepilots-mongodb mongosh --eval "db.stats()" > /dev/null 2>&1; then
  echo "✅ Database: OK"
else
  echo "❌ Database: FAILED"
fi
```

---

## 🎓 Próximos Pasos

### Aprender Más

1. **Documentación del Proyecto**
   - Leer `docs/ARCHITECTURE.md`
   - Explorar `docs/API_DOCUMENTATION.md`
   - Revisar `docs/CONTRIBUTING.md`

2. **Mejores Prácticas**
   - Seguir estándares de código
   - Escribir tests para nuevas funcionalidades
   - Mantener documentación actualizada

3. **Contribuir**
   - Revisar issues abiertos en GitHub
   - Participar en discusiones
   - Enviar pull requests

### Recursos Adicionales

- 📚 [Node.js Documentation](https://nodejs.org/docs/)
- ⚛️ [React Documentation](https://reactjs.org/docs/)
- 🐳 [Docker Documentation](https://docs.docker.com/)
- 📖 [Express.js Guide](https://expressjs.com/guide/)
- 🎵 [Twenty One Pilots Wiki](https://github.com/twentyonepilots/app/wiki)

---

## 🆘 Obtener Ayuda

### Canales de Soporte

- **🐛 Issues**: [GitHub Issues](https://github.com/twentyonepilots/app/issues)
- **💬 Discord**: [Twenty One Pilots Dev Community](https://discord.gg/twentyonepilots)
- **📧 Email**: dev@twentyonepilots.com
- **📖 Wiki**: [Project Wiki](https://github.com/twentyonepilots/app/wiki)

### Checklist de Verificación

Antes de pedir ayuda, verifica:

- [ ] Node.js versión correcta (18.x)
- [ ] Todas las dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Servicios de Docker corriendo
- [ ] Puertos no en uso por otros procesos
- [ ] Logs de error revisados

### Información Útil para Reportar Problemas

```bash
# Información del sistema
node --version
npm --version
docker --version
git --version

# Estado de servicios
docker-compose ps

# Logs recientes
docker-compose logs --tail=50

# Variables de entorno (sin valores sensibles)
cat backend/.env | grep -v SECRET | grep -v PASSWORD
```

---

**¡Felicitaciones!** 🎉

Has completado exitosamente la configuración de tu entorno de desarrollo para el proyecto Twenty One Pilots. Ahora puedes:

- ✅ Ejecutar la aplicación localmente
- ✅ Realizar cambios y probarlos
- ✅ Contribuir al proyecto
- ✅ Seguir las mejores prácticas de desarrollo

**Última actualización**: $(date)
**Versión del tutorial**: 2.0.0
**Tiempo estimado**: 45-60 minutos