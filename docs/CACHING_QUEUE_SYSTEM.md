# Sistema de Caché Distribuido y Colas de Mensajes

## 📋 Descripción General

Este documento describe la implementación completa de un sistema de caché distribuido utilizando Redis y colas de mensajes con Bull para optimizar el rendimiento de la aplicación Twenty One Pilots. El sistema está diseñado para manejar búsquedas de conciertos, letras de canciones, recomendaciones musicales y otras operaciones intensivas.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Redis Cache Service** - Servicio de caché distribuido
2. **Bull Queue Service** - Sistema de colas de mensajes
3. **Cache Middleware** - Middleware Express para cache automático
4. **Monitoring System** - Sistema de monitoreo y métricas
5. **Invalidation Strategies** - Estrategias de invalidación de caché

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Redis Cache   │
│                 │    │                 │    │                 │
│ • React App     │◄──►│ • Express App   │◄──►│ • Key-Value DB  │
│ • API Calls     │    │ • Middleware    │    │ • TTL Support   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Bull Queues   │
                       │                 │
                       │ • Email Queue   │
                       │ • Analytics Q   │
                       │ • Recommendations│
                       │ • Notifications │
                       └─────────────────┘
```

## 🔧 Configuración de Redis

### Variables de Entorno

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TLS=false

# Cache Configuration
CACHE_DEFAULT_TTL=300
CACHE_REDIS_ENABLED=true
```

### Configuración Avanzada

```javascript
// backend/config/redis.js
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  reconnectOnError: (err) => err.message.includes('READONLY')
};
```

## 🚀 Servicio de Caché (CacheService)

### Características Principales

- **Conexión robusta** con reconexión automática
- **Operaciones básicas**: get, set, del, exists
- **Operaciones avanzadas**: getOrSet, invalidación por patrones
- **Estrategias específicas** por tipo de contenido
- **Compresión automática** para valores grandes
- **Métricas integradas** de rendimiento

### Uso Básico

```javascript
const cacheService = require('./services/cacheService');

// Almacenar en caché
await cacheService.set('key', { data: 'value' }, 300); // 5 minutos TTL

// Obtener del caché
const data = await cacheService.get('key');

// Obtener o establecer
const result = await cacheService.getOrSet('key', async () => {
  return await expensiveOperation();
}, 600);
```

### Estrategias de Cache por Dominio

#### Concerts (Conciertos)
```javascript
// TTL específico para conciertos
concerts: {
  search: 600,      // 10 minutos para búsquedas
  details: 1800,    // 30 minutos para detalles
  upcoming: 300     // 5 minutos para próximos
}
```

#### Lyrics (Letras)
```javascript
lyrics: {
  search: 1800,     // 30 minutos
  details: 3600     // 1 hora
}
```

#### Products (Productos)
```javascript
products: {
  list: 900,        // 15 minutos
  details: 1800,    // 30 minutos
  categories: 3600  // 1 hora
}
```

## 📨 Sistema de Colas con Bull

### Colas Implementadas

1. **Email Queue** - Envío de correos electrónicos
2. **Analytics Queue** - Procesamiento de métricas
3. **Recommendations Queue** - Generación de recomendaciones
4. **Notifications Queue** - Envío de notificaciones

### Configuración de Colas

```javascript
// backend/services/queueService.js
const queues = {
  email: new Queue('email-queue', {
    concurrency: 5,
    limiter: { max: 10, duration: 1000 }
  }),
  analytics: new Queue('analytics-queue', {
    concurrency: 2,
    limiter: { max: 20, duration: 1000 }
  }),
  recommendations: new Queue('recommendations-queue', {
    concurrency: 3,
    limiter: { max: 5, duration: 1000 }
  }),
  notifications: new Queue('notifications-queue', {
    concurrency: 8,
    limiter: { max: 50, duration: 1000 }
  })
};
```

### Procesadores de Colas

#### Email Processor
```javascript
email.process(async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'purchase-confirmation':
      return await processPurchaseConfirmationEmail(data);
    case 'event-update':
      return await processEventUpdateEmail(data);
    case 'newsletter':
      return await processNewsletterEmail(data);
  }
});
```

#### Analytics Processor
```javascript
analytics.process(async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'search-analytics':
      return await processSearchAnalytics(data);
    case 'accessibility-metrics':
      return await processAccessibilityMetrics(data);
    case 'performance-metrics':
      return await processPerformanceMetrics(data);
  }
});
```

### Agregar Jobs a las Colas

```javascript
// Agregar email a la cola
await queueService.addEmailJob('purchase-confirmation', {
  userEmail: 'user@example.com',
  orderId: '12345',
  items: cartItems,
  total: 99.99
});

// Agregar analytics a la cola
await queueService.addAnalyticsJob('search-analytics', {
  query: 'Twenty One Pilots',
  results: 25,
  userId: 'user123',
  filters: { location: 'Madrid' }
});
```

## 🛡️ Middleware de Caché

### Cache Middleware Automático

```javascript
// Aplicar caché a rutas específicas
router.get('/search', concertsCache, async (req, res) => {
  // Esta respuesta se cacheará automáticamente
  const results = await searchConcerts(req.query);
  res.json(results);
});
```

### Invalidación Automática

```javascript
// Invalidar caché cuando se actualizan datos
router.post('/concerts', concertsInvalidation, async (req, res) => {
  const concert = await createConcert(req.body);
  res.json(concert);
  // El caché se invalida automáticamente
});
```

### Generación de Claves de Cache

```javascript
// Claves específicas por tipo de contenido
const concertsKey = `concerts:search:${city}:${date}:${artist}:${page}:${limit}`;
const lyricsKey = `lyrics:search:${query}:${artist}:${song}:${page}:${limit}`;
const productsKey = `products:search:${category}:${search}:${page}:${limit}`;
```

## 📊 Sistema de Monitoreo

### Endpoints de Monitoreo

#### Health Check
```http
GET /api/monitoring/health
```

#### Estadísticas de Cache
```http
GET /api/monitoring/cache/stats
Authorization: Bearer {MONITORING_TOKEN}
```

#### Estadísticas de Colas
```http
GET /api/monitoring/queues/stats
Authorization: Bearer {MONITORING_TOKEN}
```

#### Métricas de Rendimiento
```http
GET /api/monitoring/performance
Authorization: Bearer {MONITORING_TOKEN}
```

### Métricas Prometheus

```http
GET /api/monitoring/metrics
```

Ejemplo de métricas expuestas:
```
# HELP cache_connected Redis connection status
# TYPE cache_connected gauge
cache_connected 1

# HELP queue_email_waiting_jobs Number of waiting jobs in email queue
# TYPE queue_email_waiting_jobs gauge
queue_email_waiting_jobs 5
```

## 🔄 Estrategias de Invalidación

### Invalidación por Patrones

```javascript
// Invalidar todas las búsquedas de conciertos
await cacheService.invalidatePattern('concerts:*');

// Invalidar recomendaciones de un usuario específico
await cacheService.invalidatePattern(`recommendations:${userId}:*`);
```

### Invalidación Automática

```javascript
// Middleware que invalida automáticamente
const concertsInvalidation = createInvalidationMiddleware(['concerts:*']);

router.post('/concerts', concertsInvalidation, createConcert);
router.put('/concerts/:id', concertsInvalidation, updateConcert);
router.delete('/concerts/:id', concertsInvalidation, deleteConcert);
```

## 📈 Optimizaciones de Rendimiento

### Compresión de Datos

```javascript
// Compresión automática para valores grandes
compression: {
  enabled: true,
  threshold: 1024, // > 1KB
  algorithm: 'gzip'
}
```

### Pool de Conexiones

```javascript
// Configuración de pool de Redis
maxRetriesPerRequest: 3,
retryDelayOnFailover: 100,
family: 4, // IPv4
connectTimeout: 60000,
commandTimeout: 5000
```

### Rate Limiting por Cola

```javascript
// Limitar jobs por unidad de tiempo
limiter: {
  max: 10,        // máximo 10 jobs
  duration: 1000  // por 1000ms (1 segundo)
}
```

## 🚨 Manejo de Errores y Reintentos

### Reintentos Automáticos

```javascript
defaultJobOptions: {
  attempts: 3,           // Hasta 3 intentos
  backoff: {
    type: 'exponential', // Backoff exponencial
    delay: 5000         // Delay inicial 5 segundos
  }
}
```

### Logging de Errores

```javascript
// Logging automático de jobs fallidos
queue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed in queue ${queue.name}:`, {
    error: err.message,
    attemptsMade: job.attemptsMade,
    attemptsRemaining: job.opts.attempts - job.attemptsMade
  });
});
```

## 🧪 Testing y Desarrollo

### Comandos de Testing

```bash
# Verificar estado del caché
npm run cache:status

# Limpiar caché de desarrollo
npm run cache:clear

# Verificar estado de colas
npm run queue:status

# Limpiar colas de desarrollo
npm run queue:clear
```

### Variables de Testing

```bash
# Configuración de testing
TEST_MONGO_URI=mongodb://localhost:27017/twentyonepilots_test
TEST_REDIS_DB=1
TEST_LOG_LEVEL=error
```

## 📚 API Reference

### CacheService

| Método | Descripción | Parámetros |
|--------|-------------|------------|
| `get(key)` | Obtener valor del caché | `key: string` |
| `set(key, value, ttl)` | Establecer valor con TTL | `key, value, ttl?` |
| `del(key)` | Eliminar clave | `key: string` |
| `exists(key)` | Verificar existencia | `key: string` |
| `getOrSet(key, fetcher, ttl)` | Obtener o establecer | `key, fetcher, ttl` |
| `invalidatePattern(pattern)` | Invalidar por patrón | `pattern: string` |

### QueueService

| Método | Descripción | Parámetros |
|--------|-------------|------------|
| `addEmailJob(type, data, options)` | Agregar job de email | `type, data, options?` |
| `addAnalyticsJob(type, data, options)` | Agregar job de analytics | `type, data, options?` |
| `addRecommendationJob(userId, type, context, options)` | Agregar job de recomendaciones | `userId, type, context, options?` |
| `addNotificationJob(type, userId, data, options)` | Agregar job de notificaciones | `type, userId, data, options?` |
| `getQueueStats()` | Obtener estadísticas de colas | - |

## 🔧 Configuración de Producción

### Escalabilidad Horizontal

```javascript
// Configuración para múltiples instancias
const clusterConfig = {
  instances: 4,
  redis: {
    cluster: {
      enableOfflineQueue: false,
      redisOptions: redisConfig
    }
  }
};
```

### Alta Disponibilidad

```javascript
// Configuración Redis Sentinel
REDIS_SENTINEL_HOSTS=redis-sentinel-1:26379,redis-sentinel-2:26379
REDIS_SENTINEL_NAME=mymaster
```

### Monitoreo Avanzado

```javascript
// Integración con herramientas externas
monitoring: {
  prometheus: { enabled: true, port: 9090 },
  grafana: { enabled: true, url: 'http://localhost:3001' },
  newRelic: { enabled: true, appName: 'Twenty One Pilots API' }
}
```

## 🎯 Mejores Prácticas

### Estrategias de Cache

1. **Cache agresivo** para datos que cambian poco
2. **TTL apropiado** basado en la frecuencia de cambios
3. **Invalidación proactiva** cuando se actualizan datos
4. **Cache warming** para datos populares

### Gestión de Colas

1. **Priorización** de jobs críticos
2. **Rate limiting** para evitar sobrecarga
3. **Dead letter queues** para jobs fallidos persistentemente
4. **Monitoreo continuo** del rendimiento

### Optimización de Rendimiento

1. **Compresión** para respuestas grandes
2. **Pool de conexiones** optimizado
3. **Lazy loading** de datos relacionados
4. **Background processing** para tareas pesadas

## 📋 Checklist de Implementación

- [x] Configuración Redis básica
- [x] Servicio de caché con operaciones CRUD
- [x] Middleware de caché automático
- [x] Sistema de colas con Bull
- [x] Procesadores para diferentes tipos de jobs
- [x] Estrategias de invalidación
- [x] Sistema de monitoreo y métricas
- [x] Documentación completa
- [x] Configuración de producción
- [x] Testing y desarrollo utilities

## 🔗 Referencias

- [Redis Documentation](https://redis.io/documentation)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Express Caching Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Monitoring with Prometheus](https://prometheus.io/docs/introduction/overview/)

---

**Versión**: 1.0.0
**Última actualización**: 2025-09-22
**Autor**: Kilo Code AI Assistant