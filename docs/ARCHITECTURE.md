# 🏗️ Arquitectura de la Aplicación Twenty One Pilots

## Descripción General

Esta aplicación es una plataforma web full-stack dedicada a Twenty One Pilots que integra múltiples tecnologías y servicios para proporcionar una experiencia completa a los fans.

## Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   React SPA     │◄──►│   Express.js    │◄──►│   Datos         │
│                 │    │   REST API      │    │   MongoDB       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Servicios     │    │   Servicios     │    │   Servicios     │
│   Externos      │    │   Internos      │    │   Externos      │
│   YouTube API   │    │   YouTube       │    │   Cache Redis   │
│   Eventbrite    │    │   Service       │    │   Email SMTP    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Arquitectura por Capas

### 1. Capa de Presentación (Frontend)

#### Tecnologías
- **React 18+** con hooks modernos
- **React Router** para navegación SPA
- **Axios** para comunicación HTTP
- **CSS Modules** para estilos modulares
- **React Testing Library** para testing

#### Estructura de Componentes
```
frontend/src/
├── components/          # Componentes reutilizables
│   ├── YouTubePlayer.jsx    # Reproductor de videos
│   ├── CustomCard.js        # Tarjetas personalizadas
│   ├── Navbar.jsx           # Barra de navegación
│   └── LanguageSelector.jsx # Selector de idioma
├── pages/               # Páginas principales
│   ├── Videos.jsx           # Página de videos
│   ├── Discography.jsx      # Discografía
│   ├── Forum.jsx            # Foro de fans
│   └── Home.jsx             # Página principal
├── api/                 # Cliente API
│   └── videos.js            # API de videos
├── hooks/               # Custom hooks
│   ├── useVideosApi.js      # Hook para API de videos
│   └── useLocalStorage.js   # Hook para localStorage
├── utils/               # Utilidades
│   ├── formatters.js        # Funciones de formateo
│   └── validators.js        # Validadores frontend
└── translations/        # Internacionalización
    ├── en.json
    └── es.json
```

#### Patrón de Componentes
- **Container/Presentational Pattern**: Separación de lógica y presentación
- **Custom Hooks**: Lógica reutilizable
- **Compound Components**: Componentes compuestos para flexibilidad
- **Render Props**: Para compartir lógica compleja

### 2. Capa de Aplicación (Backend)

#### Tecnologías
- **Node.js 18+** con Express.js
- **MongoDB** con Mongoose ODM
- **JWT** para autenticación
- **bcryptjs** para hash de passwords
- **Winston** para logging
- **PM2** para gestión de procesos

#### Estructura del Backend
```
backend/
├── app.js               # Configuración principal de Express
├── server.js            # Inicialización del servidor
├── controllers/         # Controladores de negocio
│   ├── videoController.js
│   ├── discographyController.js
│   └── userController.js
├── models/              # Modelos de datos
│   ├── User.js
│   ├── Video.js
│   └── Album.js
├── routes/              # Definición de rutas
│   ├── videos.js
│   ├── auth.js
│   └── api.js
├── services/            # Servicios de negocio
│   ├── youtubeService.js
│   ├── emailService.js
│   └── cacheService.js
├── middleware/          # Middlewares personalizados
│   ├── auth.js
│   ├── validation.js
│   ├── security.js
│   └── cors.js
├── utils/               # Utilidades
│   ├── logger.js
│   ├── validators.js
│   └── helpers.js
├── config/              # Configuraciones
│   ├── database.js
│   └── security.js
└── tests/               # Tests
    ├── unit/
    ├── integration/
    └── e2e/
```

#### Patrón de Arquitectura
- **MVC Pattern**: Model-View-Controller
- **Service Layer**: Lógica de negocio separada
- **Repository Pattern**: Abstracción de datos
- **Middleware Pattern**: Procesamiento de requests

### 3. Capa de Datos

#### MongoDB Schema Design
```javascript
// Usuario
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String, // hashed
  role: String,
  createdAt: Date,
  updatedAt: Date
}

// Video
{
  _id: ObjectId,
  youtubeId: String,
  title: String,
  description: String,
  thumbnail: String,
  channelTitle: String,
  publishedAt: Date,
  duration: Number,
  viewCount: Number,
  likeCount: Number,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}

// Álbum
{
  _id: ObjectId,
  title: String,
  releaseYear: Number,
  coverImage: String,
  songs: [{
    title: String,
    duration: String,
    lyrics: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexing Strategy
- **Text indexes** para búsquedas
- **Compound indexes** para queries frecuentes
- **TTL indexes** para datos temporales
- **Geospatial indexes** para ubicaciones

### 4. Servicios Externos

#### YouTube Data API v3
- **Rate limiting**: 10,000 unidades/día
- **Caching**: 5 minutos TTL
- **Fallback**: Datos mock cuando API falla
- **Error handling**: Reintentos automáticos

#### Cache Layer (Redis)
```javascript
// Estrategia de cache
const cacheStrategy = {
  videos: { ttl: 300 },      // 5 minutos
  search: { ttl: 600 },      // 10 minutos
  user: { ttl: 3600 },       // 1 hora
  static: { ttl: 86400 }     // 24 horas
};
```

### Seguridad por Capas

#### Frontend Security
- **Content Security Policy** headers
- **XSS prevention** con sanitización
- **CSRF tokens** en formularios
- **Input validation** client-side

#### Backend Security
- **Helmet.js** para headers seguros
- **Rate limiting** por IP y endpoint
- **CORS** configurado restrictivamente
- **Input sanitization** automática
- **SQL/NoSQL injection** prevention

#### Database Security
- **Connection encryption** con SSL/TLS
- **Field-level encryption** para datos sensibles
- **Access control** con roles y permisos
- **Audit logging** para cambios críticos

### Escalabilidad y Performance

#### Optimizaciones Frontend
- **Code splitting** con React.lazy()
- **Image optimization** con lazy loading
- **Bundle analysis** con webpack-bundle-analyzer
- **Service workers** para PWA

#### Optimizaciones Backend
- **Clustering** con PM2
- **Caching** multi-nivel (Redis + in-memory)
- **Database indexing** optimizado
- **Connection pooling** para MongoDB

#### CDN y Assets
- **Static assets** servidos desde CDN
- **Image optimization** automático
- **Gzip compression** habilitado
- **HTTP/2** para mejor performance

### Monitoreo y Observabilidad

#### Métricas Recopiladas
```javascript
const metrics = {
  http: {
    requestCount: Counter,
    requestDuration: Histogram,
    errorRate: Gauge
  },
  database: {
    connectionPoolSize: Gauge,
    queryDuration: Histogram,
    connectionErrors: Counter
  },
  cache: {
    hitRate: Gauge,
    missRate: Counter,
    evictionCount: Counter
  },
  external: {
    youtubeApiCalls: Counter,
    youtubeApiErrors: Counter,
    emailSent: Counter
  }
};
```

#### Logging Strategy
- **Structured logging** con Winston
- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Log rotation** automática
- **Centralized logging** con Elasticsearch

### Estrategia de Despliegue

#### Entornos
```yaml
environments:
  development:
    replicas: 1
    resources: minimal
    features: all enabled

  staging:
    replicas: 2
    resources: medium
    features: production features

  production:
    replicas: 3+
    resources: high
    features: optimized
```

#### CI/CD Pipeline
```yaml
stages:
  - test
  - build
  - deploy

jobs:
  test:
    - lint
    - unit tests
    - integration tests
    - e2e tests

  build:
    - docker build
    - security scan
    - performance test

  deploy:
    - blue-green deployment
    - health checks
    - rollback plan
```

### Estrategia de Backup y Recovery

#### Database Backups
- **Automated backups** cada 6 horas
- **Point-in-time recovery** disponible
- **Cross-region replication** para HA
- **Backup encryption** en tránsito y reposo

#### Application Backups
- **Configuration backups** versionados
- **Asset backups** con CDN
- **Log archives** comprimidos
- **Automated restoration** scripts

### Conclusión

Esta arquitectura proporciona:
- ✅ **Escalabilidad** horizontal y vertical
- ✅ **Seguridad** en múltiples capas
- ✅ **Performance** optimizada
- ✅ **Mantenibilidad** con código modular
- ✅ **Observabilidad** completa
- ✅ **Resiliencia** con fallbacks y reintentos
- ✅ **Flexibilidad** para futuras expansiones

La arquitectura sigue las mejores prácticas de la industria y está preparada para manejar crecimiento significativo de usuarios y funcionalidades.