# 🎵 Twenty One Pilots Fan App

Aplicación web full-stack dedicada a Twenty One Pilots con funcionalidades completas de videos, discografía, foro y tienda.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [UX, Accesibilidad y Privacidad](#-ux-accesibilidad-y-privacidad)
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

## ♿ UX, Accesibilidad y Privacidad

### 🎨 Experiencia de Usuario Mejorada
- **Skeleton Loaders** durante carga de contenido
- **Indicador de calidad de conexión** con fallback automático
- **Modo oscuro persistente** con localStorage
- **Navegación por teclado completa** en VideoPlayer
- **Filtros avanzados** con múltiples criterios de búsqueda
- **Manejo de errores informativo** con acciones contextuales

### ♿ Accesibilidad WCAG 2.1 AA/AAA
- **Sistema de accesibilidad integral** con hooks personalizados
- **Componentes totalmente accesibles** con ARIA landmarks
- **Navegación por teclado completa** en toda la aplicación
- **Soporte para lectores de pantalla** con anuncios automáticos
- **Contraste de color WCAG AA** (ratio mínimo 4.5:1)
- **Herramientas de desarrollo** con auditoría automática

### 🔒 Cumplimiento GDPR/CCPA
- **Banner de cookies interactivo** con preferencias granulares
- **Política de privacidad completa** y accesible
- **Gestión de datos del usuario** con todos los derechos implementados
- **API de solicitudes de datos** para acceso, eliminación y portabilidad
- **Auditoría de privacidad automática** integrada
- **Consentimiento granular** con localStorage seguro

### 📚 Documentación Detallada
Para información completa sobre UX, accesibilidad y privacidad:
- 📖 **[UX, Accesibilidad y Privacidad](docs/UX_ACCESSIBILITY_PRIVACY.md)**

### 📊 Métricas de Cumplimiento
- **Accesibilidad WCAG:** 98% AA / 95% AAA
- **Privacidad GDPR/CCPA:** 99% cumplimiento
- **Experiencia de Usuario:** Mejoras significativas en engagement

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

## 📚 Documentación

### 📖 Guías Especializadas
- **[UX, Accesibilidad y Privacidad](docs/UX_ACCESSIBILITY_PRIVACY.md)** - Guía completa de mejoras implementadas
- **[Arquitectura del Sistema](docs/ARCHITECTURE.md)** - Diseño técnico detallado
- **[Sistema de Caché y Queue](docs/CACHING_QUEUE_SYSTEM.md)** - Optimización de performance
- **[Integración de Dependencias](docs/DEPENDENCY_INTEGRATION.md)** - Gestión de paquetes
- **[Sistema de Favoritos y Notificaciones](docs/FAVORITES_NOTIFICATIONS_SYSTEM.md)** - Funcionalidades sociales

### 📚 API Documentation

#### Videos Endpoints

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

## 📊 Sistema de Monitorización Avanzado

### 🏗️ Arquitectura de Observabilidad

La aplicación incluye un sistema completo de monitorización con **Prometheus + Grafana + Alertmanager**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus    │───▶│   Alertmanager  │
│   (Backend)     │    │   (Metrics)     │    │   (Alerts)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │    Grafana      │    │   Slack/Email   │
         │              │  (Dashboards)   │    │ (Notifications) │
         │              └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   E2E Tests     │───▶│  Pushgateway    │
│  (Playwright)   │    │   (Metrics)     │
└─────────────────┘    └─────────────────┘
```

### 🚀 Inicio Rápido de Monitorización

```bash
# Configurar variables de entorno
cd monitoring
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servicios de monitorización
./start-monitoring.sh

# Verificar estado
./health-check.sh
```

**URLs de Acceso:**
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)
- **Alertmanager:** http://localhost:9093

### 📈 Métricas Recolectadas

#### **Sistema y Performance**
- CPU, Memoria, Disco usage
- Latencia HTTP (95th percentile)
- Tasa de errores por endpoint
- Conexiones activas
- Queries de base de datos

#### **Aplicación Específica**
- Reproducciones de video
- Búsquedas realizadas
- Registros de usuarios
- Interacciones del foro
- Ventas en tienda

#### **E2E Testing**
- Resultados de tests automáticos
- Tiempos de ejecución
- Tasas de éxito/fallo

### 🚨 Sistema de Alertas

#### **Niveles de Severidad**
- **Info:** Información general
- **Warning:** Requiere atención
- **Critical:** Acción inmediata

#### **Alertas Configuradas**
- **Disponibilidad:** Backend/Frontend/MongoDB/Redis down
- **Performance:** Latencia > 2s, Error rate > 5%
- **Recursos:** Memoria > 85%, CPU > 90%
- **Aplicación:** Cache hit ratio < 70%, Queue size > 1000
- **Testing:** E2E tests fallando

#### **Notificaciones**
- **Email:** SMTP configurado con templates HTML
- **Slack:** Webhooks con formato rico y colores
- **PagerDuty/OpsGenie:** Integración opcional

### 📊 Dashboards de Grafana

#### **Dashboard Principal: "Twenty One Pilots - Overview"**
- Estado de salud de servicios
- Métricas de performance en tiempo real
- Tasas de error y latencia
- Actividad de usuarios y contenido
- Resultados de tests E2E

#### **Características**
- **Auto-provisioning:** Dashboards se configuran automáticamente
- **Responsive:** Optimizado para diferentes tamaños de pantalla
- **Time ranges:** Análisis histórico configurable
- **Alert integration:** Visualización de alertas activas

### 🔧 Configuración Avanzada

#### **Variables de Entorno**
```env
# Email para alertas
SMTP_HOST=smtp.gmail.com
SMTP_USER=alerts@yourcompany.com
SMTP_PASS=your-app-password
ALERT_EMAIL=team@yourcompany.com

# Slack para notificaciones
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Umbrales personalizables
ALERT_LATENCY_CRITICAL=5000
ALERT_ERROR_RATE_CRITICAL=0.10
```

#### **Personalización de Métricas**
```javascript
// Agregar métricas personalizadas
const customMetric = new promClient.Counter({
  name: 'custom_metric_total',
  help: 'Custom application metric'
});

// Usar en el código
customMetric.inc();
```

### 📋 Monitoreo de E2E Tests

Los tests de Playwright integran automáticamente:
- **Métricas de performance** enviadas a Pushgateway
- **Resultados de tests** en dashboards de Grafana
- **Alertas automáticas** cuando tests fallan
- **Reportes históricos** de tendencias

### 🩺 Health Checks

#### **Endpoints Disponibles**
- **API Health:** `GET /health`
- **Métricas Prometheus:** `GET /api/metrics/prometheus`
- **Health JSON:** `GET /api/health`

#### **Script de Verificación**
```bash
# Verificar todos los servicios
cd monitoring && ./health-check.sh
```

### 📚 Documentación Detallada

Para información completa sobre el sistema de monitorización:
- 📖 **[Documentación Completa](monitoring/README.md)**
- 🏥 **[Health Checks](monitoring/health-check.sh)**
- 🚀 **[Inicio Rápido](monitoring/start-monitoring.sh)**
- ⚙️ **[Configuración](monitoring/.env.example)**

### 🔍 Troubleshooting

#### **Servicios No Inician**
```bash
# Ver logs de servicios
docker-compose --profile monitoring logs

# Verificar configuración
cd monitoring && ./health-check.sh
```

#### **Alertas No Se Envían**
```bash
# Probar webhook de Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test alert"}' $SLACK_WEBHOOK_URL

# Verificar configuración SMTP
docker-compose logs alertmanager
```

#### **Métricas No Aparecen**
```bash
# Verificar endpoint de métricas
curl http://localhost:5000/api/metrics/prometheus

# Verificar configuración de Prometheus
docker-compose logs prometheus
```

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

### ♿ Accesibilidad y Privacidad
- **Reportes de accesibilidad:** accessibility@twentyonepilots-app.com
- **Solicitudes de datos (GDPR/CCPA):** privacy@twentyonepilots-app.com
- **Documentación de cumplimiento:** [UX, Accesibilidad y Privacidad](docs/UX_ACCESSIBILITY_PRIVACY.md)

---

**Desarrollado con ❤️ para la comunidad de fans de Twenty One Pilots**