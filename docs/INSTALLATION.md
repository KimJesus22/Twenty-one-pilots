# Guía de Instalación y Configuración

## 🚀 Instalación Rápida

### Prerrequisitos
- **Node.js** 16.x o superior
- **MongoDB** (local o Atlas)
- **Git**
- **NPM** o **Yarn**

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/twenty-one-pilots-platform.git
cd twenty-one-pilots-platform
```

### 2. Configurar el Backend
```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
```

### 3. Configurar Variables de Entorno
Edita el archivo `backend/.env`:

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/twentyonepilots
# O para MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/twentyonepilots

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d

# APIs Externas
YOUTUBE_API_KEY=tu_youtube_api_key_aqui
EVENTBRITE_API_KEY=tu_eventbrite_api_key_aqui

# Servidor
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### 4. Configurar el Frontend
```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo de configuración (si existe)
cp .env.example .env
```

### 5. Ejecutar la Aplicación

#### Opción A: Desarrollo (Recomendado)
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

#### Opción B: Producción
```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run serve
```

### 6. Verificar Instalación
- **Backend**: http://localhost:5000/api/health
- **Frontend**: http://localhost:3000
- **Documentación API**: http://localhost:5000/api-docs

## 🐳 Instalación con Docker

### Prerrequisitos
- **Docker** 20.x o superior
- **Docker Compose** 2.x o superior

### 1. Clonar y Configurar
```bash
git clone https://github.com/tu-usuario/twenty-one-pilots-platform.git
cd twenty-one-pilots-platform

# Crear archivos de configuración
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configurar Variables de Entorno
Edita `backend/.env`:
```env
MONGO_URI=mongodb://mongo:27017/twentyonepilots
# ... otras variables
```

### 3. Construir y Ejecutar
```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Verificar Docker
```bash
# Ver servicios ejecutándose
docker-compose ps

# Acceder a logs específicos
docker-compose logs backend
docker-compose logs frontend
```

## 🗄️ Configuración de MongoDB

### Opción A: MongoDB Local
```bash
# Instalar MongoDB
# Windows (con Chocolatey)
choco install mongodb

# macOS (con Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Iniciar MongoDB
mongod --dbpath /ruta/a/tu/base/de/datos
```

### Opción B: MongoDB Atlas (Recomendado)
1. Ve a https://cloud.mongodb.com
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (M0 - gratuito)
4. Configura usuario y contraseña
5. Whitelist de IP (agrega `0.0.0.0/0` para desarrollo)
6. Obtén la connection string
7. Actualiza `MONGO_URI` en `.env`

## 🔑 Configuración de APIs Externas

### YouTube Data API v3
1. Ve a https://console.developers.google.com/
2. Crea un nuevo proyecto
3. Habilita "YouTube Data API v3"
4. Crea credenciales (API Key)
5. Actualiza `YOUTUBE_API_KEY` en `.env`

### Eventbrite API
1. Ve a https://www.eventbrite.com/platform/api/
2. Crea una cuenta de desarrollador
3. Crea una aplicación
4. Obtén tu API Key
5. Actualiza `EVENTBRITE_API_KEY` en `.env`

## 📧 Configuración de Email (Opcional)

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
```

### Outlook
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASS=tu-password
```

## 🔴 Configuración de Redis (Opcional)

### Redis Local
```bash
# Instalar Redis
# Windows (con Chocolatey)
choco install redis-64

# macOS (con Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server

# Iniciar Redis
redis-server
```

### Redis Cloud (Recomendado)
1. Ve a https://redis.com/try-free/
2. Crea cuenta gratuita
3. Obtén la connection URL
4. Actualiza `REDIS_URL` en `.env`

## 🔒 Configuración de Seguridad

### Generar JWT Secret Seguro
```bash
# Linux/macOS
openssl rand -hex 32

# Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32,0)
```

### Configuración de CORS
```env
# Para desarrollo
FRONTEND_URL=http://localhost:3000

# Para producción
FRONTEND_URL=https://tu-dominio.com
```

## 🧪 Ejecutar Tests

### Backend
```bash
cd backend

# Todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests específicos
npm test -- --testNamePattern="auth"
```

### Frontend
```bash
cd frontend

# Todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests E2E (si está configurado)
npm run test:e2e
```

## 🚀 Despliegue en Producción

### Variables de Entorno de Producción
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://prod-user:prod-pass@prod-cluster.mongodb.net/twentyonepilots
JWT_SECRET=tu_jwt_secret_de_produccion_muy_seguro
FRONTEND_URL=https://tu-dominio.com
```

### Build de Producción
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Servidores Recomendados
- **Heroku** (fácil setup)
- **DigitalOcean** (VPS económico)
- **AWS** (escalable)
- **Vercel** (frontend)
- **Railway** (backend + base de datos)

## 🔧 Solución de Problemas

### Error: "MongoDB connection failed"
```bash
# Verificar si MongoDB está ejecutándose
# Local
sudo systemctl status mongod

# Atlas: Verificar connection string y whitelist de IP
```

### Error: "Port already in use"
```bash
# Encontrar proceso usando el puerto
lsof -i :5000

# Matar proceso
kill -9 <PID>
```

### Error: "YouTube API quota exceeded"
- Espera a que se resetee la quota (diaria)
- O implementa caching para reducir requests

### Error: "CORS policy blocked"
```javascript
// En backend, verificar configuración de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000',
  credentials: true
};
```

## 📊 Monitoreo

### Logs
```bash
# Ver logs del backend
cd backend && tail -f logs/combined.log

# Ver logs de errores
tail -f logs/error.log
```

### Health Checks
```bash
# Verificar estado de la API
curl http://localhost:5000/api/health

# Verificar base de datos
curl http://localhost:5000/api/health/database
```

## 🔄 Actualizaciones

### Actualizar Dependencias
```bash
# Backend
cd backend && npm update

# Frontend
cd frontend && npm update
```

### Migraciones de Base de Datos
```bash
# Si hay cambios en el esquema
cd backend
npm run migrate
```

## 📞 Soporte

Si encuentras problemas durante la instalación:

1. Revisa los logs en `backend/logs/`
2. Verifica las variables de entorno
3. Consulta la documentación en `/docs`
4. Abre un issue en GitHub
5. Contacta al equipo de desarrollo

---

¡Tu plataforma Twenty One Pilots está lista para usar! 🎵