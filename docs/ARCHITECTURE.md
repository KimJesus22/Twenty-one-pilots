# Arquitectura de la Plataforma Twenty One Pilots

## 🏗️ Arquitectura General

La plataforma sigue una arquitectura **modular y escalable** basada en principios SOLID y separación de responsabilidades.

### Patrón Arquitectónico
- **Backend**: Arquitectura en capas (Routes → Controllers → Services → Models)
- **Frontend**: Componentes modulares con estado centralizado
- **Base de datos**: MongoDB con esquema flexible

## 📁 Estructura del Proyecto

```
twenty-one-pilots-platform/
├── backend/
│   ├── controllers/     # Controladores (lógica de negocio)
│   │   ├── authController.js
│   │   ├── discographyController.js
│   │   └── ...
│   ├── models/         # Modelos de datos (Mongoose)
│   │   ├── User.js
│   │   ├── Album.js
│   │   ├── Song.js
│   │   └── ...
│   ├── routes/         # Definición de rutas
│   │   ├── auth.js
│   │   ├── discography.js
│   │   ├── videos.js
│   │   └── ...
│   ├── services/       # Servicios externos y lógica compleja
│   │   ├── authService.js
│   │   ├── youtubeService.js
│   │   ├── eventbriteService.js
│   │   └── ...
│   ├── middleware/     # Middleware personalizado
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── cache.js
│   │   └── ...
│   ├── utils/          # Utilidades
│   │   ├── logger.js
│   │   ├── validationSchemas.js
│   │   └── ...
│   ├── validations/    # Validaciones con Joi
│   ├── tests/          # Tests automatizados
│   └── config/         # Configuraciones
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React reutilizables
│   │   ├── pages/      # Páginas de la aplicación
│   │   ├── services/   # Servicios para llamadas API
│   │   ├── hooks/      # Custom hooks
│   │   ├── context/    # Context providers
│   │   ├── utils/      # Utilidades del frontend
│   │   └── styles/     # Estilos y temas
│   └── public/         # Archivos estáticos
└── docs/               # Documentación
```

## 🔄 Flujo de Datos

### Backend Flow
```
Request → Middleware → Route → Controller → Service → Model → Database
Response ← Controller ← Service ← Model ← Database
```

### Frontend Flow
```
User Action → Component → Service/API Call → Backend → Database
Response → Service → Component → UI Update
```

## 🗄️ Modelos de Datos

### Usuario (User)
```javascript
{
  _id: ObjectId,
  username: String (único, requerido),
  email: String (único, requerido),
  password: String (hasheado, requerido),
  role: String (enum: ['user', 'admin'], default: 'user'),
  playlists: [ObjectId], // Referencias a Playlist
  createdAt: Date,
  updatedAt: Date
}
```

### Álbum (Album)
```javascript
{
  _id: ObjectId,
  title: String (requerido),
  releaseYear: Number (requerido),
  coverImage: String (URL opcional),
  songs: [ObjectId], // Referencias a Song
  createdAt: Date,
  updatedAt: Date
}
```

### Canción (Song)
```javascript
{
  _id: ObjectId,
  title: String (requerido),
  lyrics: String (opcional),
  duration: String (formato MM:SS),
  album: ObjectId (referencia a Album),
  createdAt: Date,
  updatedAt: Date
}
```

### Playlist
```javascript
{
  _id: ObjectId,
  name: String (requerido),
  description: String (opcional),
  user: ObjectId (referencia a User, requerido),
  songs: [ObjectId], // Referencias a Song
  isPublic: Boolean (default: false),
  likes: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Sistema de Autenticación

### JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Payload**: `{ userId, iat, exp }`
- **Secret**: Configurado en variables de entorno
- **Expiración**: 7 días por defecto

### Middleware de Autenticación
```javascript
const authService = require('../services/authService');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
```

## 🌐 APIs Externas

### YouTube Data API v3
- **Propósito**: Obtener videos oficiales y contenido
- **Endpoints utilizados**:
  - `search`: Búsqueda de videos
  - `videos`: Detalles de video específico
- **Rate limiting**: 10,000 unidades por día
- **Caching**: 30 minutos para resultados

### Eventbrite API
- **Propósito**: Información de conciertos y eventos
- **Endpoints utilizados**:
  - `events/search`: Búsqueda de eventos
  - `events/{id}`: Detalles de evento específico
- **Rate limiting**: 2000 requests por hora
- **Caching**: 15 minutos para resultados

## 📊 Sistema de Caché

### Estrategias de Caché
- **Redis** para datos frecuentemente accedidos
- **In-memory cache** para datos de sesión
- **HTTP caching** con headers apropiados

### Políticas de Caché
```javascript
// Datos públicos (álbumes, canciones)
cachePublic('albums', 1800); // 30 minutos

// Datos de usuario
cachePrivate('user-profile', 900); // 15 minutos

// APIs externas
cacheExternal('youtube-search', 1800); // 30 minutos
```

## 🧪 Testing Strategy

### Backend Tests
- **Unit Tests**: Servicios y utilidades
- **Integration Tests**: Controladores y rutas
- **E2E Tests**: Flujos completos de usuario

### Frontend Tests
- **Component Tests**: Componentes React
- **Integration Tests**: Interacciones usuario
- **E2E Tests**: Cypress para flujos críticos

### Herramientas
- **Jest** + **Supertest** para backend
- **React Testing Library** para frontend
- **Cypress** para E2E

## 🔒 Seguridad

### Medidas Implementadas
- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Prevención de ataques DoS
- **Input Validation**: express-validator + Joi
- **Password Hashing**: bcrypt con salt rounds
- **CORS**: Configurado para orígenes específicos
- **JWT**: Tokens seguros con expiración

### Validaciones
```javascript
// Validación de registro
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];
```

## 📱 Progressive Web App (PWA)

### Características PWA
- **Service Worker**: Caching offline
- **Web App Manifest**: Instalación en dispositivo
- **Push Notifications**: Notificaciones push (opcional)
- **Background Sync**: Sincronización en background

### Service Worker Strategy
```javascript
// Cache-first para recursos estáticos
// Network-first para datos dinámicos
// Cache-only para recursos críticos
```

## ♿ Accesibilidad (WCAG 2.1 AA)

### Implementaciones
- **Navegación por teclado**: Todos los elementos focusables
- **Lectores de pantalla**: Etiquetas ARIA apropiadas
- **Alto contraste**: Tema de alto contraste disponible
- **Skip links**: Enlaces para saltar navegación
- **Focus management**: Indicadores de foco visibles

## 🚀 Escalabilidad

### Estrategias
- **Horizontal Scaling**: Load balancer + múltiples instancias
- **Database Sharding**: Particionamiento de datos
- **CDN**: Para recursos estáticos
- **Microservicios**: Posible separación futura

### Optimizaciones
- **Database Indexing**: Índices en campos de búsqueda
- **Query Optimization**: Paginación y límites
- **Caching Layers**: Redis + HTTP caching
- **Compression**: Gzip para respuestas

## 📊 Monitoreo y Logging

### Winston Logger
```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});
```

### Métricas Monitoreadas
- **Performance**: Response times, throughput
- **Errors**: Rate de errores, tipos de error
- **Usage**: Requests por endpoint, usuarios activos
- **Resources**: CPU, memoria, database connections

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
```

### Stages
1. **Linting**: ESLint para calidad de código
2. **Testing**: Jest para unit/integration tests
3. **Build**: Compilación de assets
4. **Deploy**: Despliegue automático a staging/production

## 🐳 Dockerización

### Dockerfile Backend
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/twentyonepilots
    depends_on:
      - mongo

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 📈 Métricas de Rendimiento

### Objetivos
- **Response Time**: < 200ms para APIs críticas
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **Throughput**: > 1000 requests/second

### Monitoreo
- **Application Metrics**: Response times, error rates
- **System Metrics**: CPU, memoria, disco
- **Business Metrics**: Usuarios activos, conversiones
- **External APIs**: Health checks, rate limits

## 🔧 Mantenimiento

### Tareas Programadas
- **Database Cleanup**: Limpieza de datos antiguos
- **Cache Invalidation**: Invalidación de caché expirado
- **Log Rotation**: Rotación de archivos de log
- **Backup**: Copias de seguridad automáticas

### Estrategias de Backup
- **Database**: MongoDB dumps diarios
- **Files**: Sincronización con cloud storage
- **Configuration**: Versionado en Git
- **Logs**: Archivado comprimido

---

Esta arquitectura proporciona una base sólida y escalable para la plataforma de fans de Twenty One Pilots, preparada para crecer con nuevas funcionalidades y mayor carga de usuarios.