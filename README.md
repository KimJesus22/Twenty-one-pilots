# 🎵 Twenty One Pilots Fan App

Aplicación web full-stack dedicada a Twenty One Pilots con funcionalidades completas de videos, discografía, foro y tienda.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [Seguridad](#-seguridad)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Despliegue](#-despliegue)

## ✨ Características

### 🎥 Videos
- **Integración completa con YouTube API v3**
- **Búsqueda avanzada** de videos oficiales
- **Reproductor integrado** con react-youtube
- **Sistema de caché** para optimizar performance
- **Rate limiting** para evitar sobrecarga de API
- **Responsive design** para todos los dispositivos

### 🎵 Discografía
- **CRUD completo** para álbumes y canciones
- **Integración con MongoDB** para persistencia
- **Validaciones robustas** con express-validator
- **Relaciones entre modelos** (álbumes ↔ canciones)

### 🗣️ Foro
- **Sistema de hilos y comentarios**
- **Autenticación de usuarios**
- **Moderación de contenido**
- **Búsqueda y filtros**

### 🛒 Tienda
- **Catálogo de productos**
- **Carrito de compras**
- **Integración con pasarelas de pago**

### 🔒 Seguridad
- **Helmet.js** para headers de seguridad
- **CORS configurado** con orígenes permitidos
- **CSRF protection** personalizado
- **Rate limiting** avanzado
- **Validación de entrada** con Joi y express-validator
- **Sanitización** de datos XSS
- **Prevención de NoSQL injection**

### 📊 Monitoreo
- **Sistema de logging** completo con Winston
- **Métricas de performance**
- **Health checks** automáticos
- **Alertas configurables**

## 🏗️ Arquitectura

```
├── backend/
│   ├── controllers/          # Controladores de negocio
│   │   ├── videoController.js
│   │   └── discographyController.js
│   ├── models/              # Modelos de MongoDB
│   │   ├── Discography.js
│   │   ├── User.js
│   │   └── Forum.js
│   ├── routes/              # Definición de rutas
│   │   ├── videos.js
│   │   ├── discography.js
│   │   └── forum.js
│   ├── services/            # Servicios externos
│   │   ├── youtubeService.js
│   │   └── cacheService.js
│   ├── middleware/          # Middlewares personalizados
│   │   ├── security.js
│   │   ├── validation.js
│   │   └── auth.js
│   ├── utils/               # Utilidades
│   │   └── logger.js
│   ├── config/              # Configuraciones
│   ├── tests/               # Tests automatizados
│   └── ssl/                 # Certificados SSL
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── YouTubePlayer.jsx
│   │   │   └── CustomCard.js
│   │   ├── pages/           # Páginas principales
│   │   │   ├── Videos.jsx
│   │   │   └── Discography.jsx
│   │   ├── api/             # Cliente API
│   │   │   └── videos.js
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilidades frontend
│   └── public/              # Assets estáticos
└── docs/                    # Documentación
```

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- MongoDB 6+
- npm o yarn
- YouTube Data API v3 key

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/twentyonepilots

# JWT
JWT_SECRET=your_jwt_secret_key_here

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Servidor
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# SSL (opcional)
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### YouTube API Setup
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la **YouTube Data API v3**
4. Crea credenciales (API Key)
5. Agrega la key al archivo `.env`

## 🎯 Uso

### Desarrollo
```bash
# Backend
cd backend && npm run dev

# Frontend (nueva terminal)
cd frontend && npm start
```

### Producción
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build && npm run serve
```

### Acceder a la aplicación
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 📚 API Documentation

### Videos Endpoints

#### GET /api/videos/search
Buscar videos en YouTube
```javascript
GET /api/videos/search?q=Twenty One Pilots&maxResults=10
```

#### GET /api/videos/:id
Obtener detalles de un video específico
```javascript
GET /api/videos/VIDEO_ID
```

#### GET /api/videos/popular
Obtener videos populares
```javascript
GET /api/videos/popular?limit=10&page=1
```

### Discografía Endpoints

#### GET /api/discography/albums
Obtener todos los álbumes
```javascript
GET /api/discography/albums
```

#### POST /api/discography/albums
Crear nuevo álbum
```javascript
POST /api/discography/albums
{
  "title": "Blurryface",
  "releaseYear": 2015,
  "coverImage": "url_to_image"
}
```

### Foro Endpoints

#### GET /api/forum/threads
Obtener hilos del foro
```javascript
GET /api/forum/threads?page=1&limit=10
```

#### POST /api/forum/threads
Crear nuevo hilo
```javascript
POST /api/forum/threads
{
  "title": "Nuevo hilo",
  "content": "Contenido del hilo",
  "authorId": "user_id"
}
```

## 🔒 Seguridad

### Headers de Seguridad (Helmet.js)
- **X-Powered-By:** Deshabilitado
- **X-Frame-Options:** DENY (previene clickjacking)
- **X-Content-Type-Options:** nosniff
- **Referrer-Policy:** strict-origin-when-cross-origin
- **CSP (Content Security Policy):** Políticas estrictas

### Rate Limiting
- **General:** 100 requests por 15 minutos
- **Auth:** 5 requests por 15 minutos
- **API específica:** Configurable por endpoint

### Validación de Entrada
- **express-validator:** Validaciones server-side
- **Joi schemas:** Validaciones complejas
- **Sanitización:** Prevención XSS
- **NoSQL Injection:** Protección automática

### Autenticación y Autorización
- **JWT tokens** para sesiones
- **bcryptjs** para hash de passwords
- **Role-based access control**
- **Session management** seguro

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Ejecutar todos los tests
npm run test:watch         # Tests en modo watch
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Ejecutar tests de React
npm run test:e2e          # Tests end-to-end (si configurados)
```

### Tests de API
```bash
# Health check
curl http://localhost:5000/health

# Test YouTube API
curl "http://localhost:5000/api/videos/search?q=Twenty One Pilots"
```

## 🚢 Despliegue

### PM2 (Producción)
```bash
cd backend
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

### Docker
```bash
# Construir imagen
docker build -t twentyonepilots-app .

# Ejecutar contenedor
docker run -p 5000:5000 -p 3000:3000 twentyonepilots-app
```

### SSL/HTTPS
Para producción, configura certificados SSL:
```bash
# Generar certificados de desarrollo
cd backend/ssl
node generate-dev-certs.js

# Para producción, usa Let's Encrypt o certificados válidos
```

## 📈 Monitoreo

### Logs
- **Winston logger** con múltiples transportes
- **Rotación automática** de archivos de log
- **Niveles configurables:** error, warn, info, debug
- **Formato JSON** para análisis

### Métricas
- **Health checks** en `/health`
- **Performance monitoring**
- **API usage tracking**
- **Error rate monitoring**

### Alertas
- **Configurables** para diferentes eventos
- **Integración** con servicios externos
- **Thresholds** personalizables

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **Twenty One Pilots** por la inspiración musical
- **Google YouTube API** por la integración de videos
- **MongoDB** por la base de datos
- **React** por el framework frontend
- **Express.js** por el framework backend

## 📞 Soporte

Para soporte técnico:
- 📧 Email: support@twentyonepilots-app.com
- 🐛 Issues: [GitHub Issues](https://github.com/username/twentyonepilots-app/issues)
- 📖 Docs: [Documentación completa](docs/)

---

**Desarrollado con ❤️ para la comunidad de fans de Twenty One Pilots**