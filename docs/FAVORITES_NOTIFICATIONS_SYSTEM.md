# 🎵 Sistema de Favoritos y Notificaciones

## 📋 Descripción General

Este documento describe la implementación completa del sistema de favoritos y notificaciones para la aplicación Twenty One Pilots. El sistema permite a los usuarios marcar como favoritos canciones, álbumes, videos y artículos, almacenando los datos de manera eficiente en Redis. Además, incluye un sistema completo de notificaciones que se envían por email, push notifications e in-app cuando ocurren eventos relevantes como nuevos conciertos, lanzamientos de álbumes o respuestas en el foro.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Favorites Service** - Servicio de gestión de favoritos con Redis
2. **Notifications Service** - Sistema de notificaciones multi-canal
3. **Queue Integration** - Integración con Bull para procesamiento asíncrono
4. **Cache Integration** - Integración con sistema de caché existente
5. **Frontend Hooks** - Hooks de React para gestión de estado
6. **API Endpoints** - Endpoints REST completos

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Redis Cache   │
│                 │    │                 │    │                 │
│ • React Hooks   │◄──►│ • Controllers   │◄──►│ • Favorites     │
│ • State Mgmt    │    │ • Services      │    │ • Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Bull Queues   │
                       │                 │
                       │ • Email Queue   │
                       │ • Push Queue    │
                       │ • In-App Queue  │
                       │ • SMS Queue     │
                       └─────────────────┘
```

## 🎯 Sistema de Favoritos

### Características Principales

- **Almacenamiento en Redis** para acceso ultra-rápido
- **Datos denormalizados** para evitar joins costosos
- **Búsqueda y filtrado avanzado** por tipo, tags, rating
- **Tags personalizados** y notas del usuario
- **Estadísticas de uso** y analytics
- **Cache inteligente** con invalidación automática
- **Sincronización de datos** cuando cambian los items originales

### Modelo de Datos

```javascript
const favoriteSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['song', 'album', 'video', 'article', 'concert', 'playlist'] },
  itemId: { type: ObjectId, required: true },
  itemData: {
    title: String,
    artist: String,
    coverImage: String,
    duration: String,
    releaseYear: Number,
    category: String
  },
  tags: [String],
  notes: String,
  rating: { type: Number, min: 1, max: 5 },
  isPublic: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now }
});
```

### Tipos de Items Soportados

| Tipo | Descripción | Datos Específicos |
|------|-------------|-------------------|
| `song` | Canciones individuales | `title`, `artist`, `duration`, `album` |
| `album` | Álbumes completos | `title`, `artist`, `releaseYear`, `coverImage` |
| `video` | Videos musicales | `title`, `artist`, `duration`, `thumbnail` |
| `article` | Artículos y noticias | `title`, `author`, `category`, `summary` |
| `concert` | Eventos en vivo | `name`, `venue`, `date`, `city` |
| `playlist` | Listas de reproducción | `name`, `description`, `creator`, `songCount` |

## 📨 Sistema de Notificaciones

### Canales de Notificación

1. **In-App Notifications** - Notificaciones dentro de la aplicación
2. **Email Notifications** - Correos electrónicos HTML
3. **Push Notifications** - Notificaciones push del navegador/dispositivo
4. **SMS Notifications** - Mensajes de texto (opcional)

### Tipos de Notificación

| Tipo | Descripción | Prioridad | Canales |
|------|-------------|-----------|---------|
| `new_concert` | Nuevo concierto disponible | Alta | In-App, Email, Push |
| `album_release` | Nuevo álbum lanzado | Alta | In-App, Email |
| `song_release` | Nueva canción disponible | Normal | In-App, Email |
| `video_upload` | Nuevo video subido | Normal | In-App, Push |
| `forum_reply` | Respuesta en foro | Normal | In-App, Email |
| `forum_mention` | Mención en foro | Normal | In-App, Email, Push |
| `favorite_update` | Actualización de favorito | Baja | In-App |
| `playlist_update` | Cambio en playlist | Baja | In-App |
| `system_announcement` | Anuncio del sistema | Normal | In-App, Email |
| `personal_message` | Mensaje personal | Alta | In-App, Email, Push |
| `event_reminder` | Recordatorio de evento | Alta | In-App, Push |
| `price_drop` | Bajada de precio | Normal | In-App, Email |
| `restock_alert` | Producto disponible | Normal | In-App, Email |

### Modelo de Notificación

```javascript
const notificationSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    itemId: ObjectId,
    itemType: String,
    itemTitle: String,
    url: String,
    image: String,
    metadata: Mixed
  },
  channels: [{ type: String, enum: ['in_app', 'email', 'push', 'sms'] }],
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'] },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'] },
  sentAt: Date,
  readAt: Date,
  expiresAt: Date
});
```

## 🔧 API Endpoints

### Favoritos

#### Gestión Básica
```http
POST   /api/favorites              # Agregar a favoritos
DELETE /api/favorites/:type/:id    # Remover de favoritos
GET    /api/favorites/check/:type/:id # Verificar si está en favoritos
POST   /api/favorites/toggle       # Toggle favorito
```

#### Gestión Avanzada
```http
GET    /api/favorites              # Obtener favoritos (con filtros)
PUT    /api/favorites/:id          # Actualizar favorito
POST   /api/favorites/:id/tags     # Agregar tags
DELETE /api/favorites/:id/tags     # Remover tags
```

#### Estadísticas y Búsqueda
```http
GET    /api/favorites/stats        # Estadísticas del usuario
GET    /api/favorites/popular/:type # Items populares
GET    /api/favorites/search       # Buscar en favoritos
```

### Notificaciones

#### Gestión de Notificaciones
```http
POST   /api/notifications          # Crear notificación
GET    /api/notifications          # Obtener notificaciones
GET    /api/notifications/unread-count # Conteo no leídas
PUT    /api/notifications/:id/read # Marcar como leída
PUT    /api/notifications/mark-all-read # Marcar todas como leídas
DELETE /api/notifications/:id      # Eliminar notificación
```

#### Notificaciones Automáticas
```http
POST   /api/notifications/notify/concert # Notificar concierto
POST   /api/notifications/notify/album   # Notificar álbum
```

#### Preferencias
```http
GET    /api/notifications/preferences    # Obtener preferencias
PUT    /api/notifications/preferences    # Actualizar preferencias
POST   /api/notifications/test           # Probar notificación
```

## 🚀 Servicios Backend

### FavoritesService

```javascript
const favoritesService = require('./services/favoritesService');

// Agregar favorito
const favorite = await favoritesService.addToFavorites(userId, 'song', songId, {
  title: 'Stressed Out',
  artist: 'Twenty One Pilots'
}, { tags: ['favorites', 'pop'] });

// Verificar favorito
const isFav = await favoritesService.isFavorite(userId, 'song', songId);

// Buscar favoritos
const results = await favoritesService.getUserFavorites(userId, {
  search: 'twenty one pilots',
  itemType: 'song',
  rating: 4
});
```

### NotificationsService

```javascript
const notificationsService = require('./services/notificationsService');

// Crear notificación manual
await notificationsService.createNotification(userId, {
  type: 'system_announcement',
  title: '¡Bienvenido!',
  message: 'Gracias por unirte a Twenty One Pilots',
  channels: ['in_app', 'email'],
  priority: 'normal'
});

// Notificar nuevo concierto
await notificationsService.notifyNewConcert({
  _id: concertId,
  name: 'Concierto Madrid',
  date: '2025-06-15',
  venue: 'Wizink Center',
  artist: 'Twenty One Pilots'
});
```

## ⚛️ Frontend Hooks

### useFavorites Hook

```javascript
import { useFavorites } from '../hooks/useFavorites';

function SongComponent({ song }) {
  const {
    hasFavorite,
    toggleFavorite,
    addTags,
    loading,
    error
  } = useFavorites();

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite('song', song._id, {
        title: song.title,
        artist: song.artist,
        duration: song.duration
      });
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <h3>{song.title}</h3>
      <button
        onClick={handleToggleFavorite}
        disabled={loading}
      >
        {hasFavorite('song', song._id) ? '❤️' : '🤍'}
      </button>
    </div>
  );
}
```

### useNotifications Hook

```javascript
import { useNotifications } from '../hooks/useNotifications';

function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading
  } = useNotifications();

  return (
    <div className="notifications-panel">
      <h3>Notificaciones ({unreadCount})</h3>

      <button onClick={markAllAsRead}>
        Marcar todas como leídas
      </button>

      {notifications.map(notification => (
        <div
          key={notification._id}
          className={notification.status === 'read' ? 'read' : 'unread'}
        >
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification._id)}>
            Marcar como leída
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Integración con Colas

### Procesamiento Asíncrono

```javascript
// En queueService.js - procesadores de notificaciones
queues.notifications.process(async (job) => {
  const { type, userId, data } = job.data;

  switch (type) {
    case 'push-notification':
      return await processPushNotification(userId, data);
    case 'in-app-notification':
      return await processInAppNotification(userId, data);
    case 'sms-notification':
      return await processSMSNotification(userId, data);
  }
});
```

### Agregar Jobs a las Colas

```javascript
// Agregar notificación de email
await queueService.addEmailJob('notification', {
  userId,
  notificationId,
  title: 'Nuevo concierto disponible',
  message: 'Twenty One Pilots en Madrid...',
  type: 'new_concert'
});

// Agregar notificación push
await queueService.addNotificationJob('push-notification', userId, {
  title: '🎵 Nuevo lanzamiento',
  message: 'Escucha la nueva canción de Twenty One Pilots',
  icon: '/icon.png',
  badge: '/badge.png'
});
```

## 📊 Cache y Optimización

### Estrategias de Cache

```javascript
// Cache de verificación de favoritos (10 min)
const cacheKey = `favorites:check:${userId}:${itemType}:${itemId}`;
await cacheService.set(cacheKey, isFavorite, 600);

// Cache de lista de favoritos (30 min)
const listKey = `favorites:user:${userId}:${filtersHash}:${paginationHash}`;
await cacheService.set(listKey, favorites, 1800);

// Invalidación automática
await cacheService.invalidatePattern(`favorites:user:${userId}:*`);
```

### Optimizaciones de Rendimiento

1. **Datos denormalizados** en favoritos para evitar joins
2. **Cache multi-nivel** (Redis + in-memory)
3. **Invalidación inteligente** por patrones
4. **Compresión automática** para respuestas grandes
5. **Lazy loading** de datos relacionados
6. **Background sync** para actualizar datos obsoletos

## 🔐 Autenticación y Seguridad

### Middleware de Autenticación

```javascript
// Todas las rutas requieren autenticación
router.use(authService.authenticateToken);

// Solo administradores pueden enviar notificaciones masivas
router.post('/notify/*', authService.requireAdmin);
```

### Validación de Datos

```javascript
const favoriteValidations = [
  body('itemType').isIn(['song', 'album', 'video', 'article', 'concert', 'playlist']),
  body('itemId').isMongoId(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('tags').optional().isArray(),
  body('notes').optional().isString().isLength({ max: 1000 })
];
```

### Rate Limiting

```javascript
// Limitar acciones de favoritos
const favoriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 acciones por ventana
  message: 'Demasiadas acciones de favoritos'
});
```

## 📈 Monitoreo y Analytics

### Métricas de Favoritos

```javascript
// Estadísticas de uso
const stats = await favoritesService.getUserStats(userId);
// {
//   song: { count: 25, avgRating: 4.2, lastAdded: '2025-01-15' },
//   album: { count: 8, avgRating: 4.5, lastAdded: '2025-01-10' },
//   video: { count: 12, avgRating: 3.8, lastAdded: '2025-01-12' }
// }
```

### Métricas de Notificaciones

```javascript
// Estadísticas de entrega
const deliveryStats = await notificationsService.getNotificationStats(userId);
// {
//   'new_concert': { sent: 5, delivered: 5, read: 3, failed: 0 },
//   'album_release': { sent: 3, delivered: 3, read: 2, failed: 0 }
// }
```

### Dashboard de Monitoreo

```http
GET /api/monitoring/favorites/stats   # Estadísticas de favoritos
GET /api/monitoring/notifications/stats # Estadísticas de notificaciones
GET /api/monitoring/favorites/popular # Items más favoritos
```

## 🎯 Casos de Uso

### Para Usuarios

1. **Marcar canciones favoritas** durante la reproducción
2. **Crear listas temáticas** con tags personalizados
3. **Recibir notificaciones** de nuevos lanzamientos
4. **Recordatorios automáticos** de conciertos próximos
5. **Interacciones sociales** en el foro con notificaciones

### Para la Plataforma

1. **Analytics de engagement** basado en favoritos
2. **Recomendaciones personalizadas** usando datos de favoritos
3. **Campañas de marketing** dirigidas por preferencias
4. **Notificaciones inteligentes** basadas en comportamiento
5. **Monetización** a través de productos relacionados

## 🔧 Configuración de Producción

### Variables de Entorno

```bash
# Redis para favoritos
REDIS_HOST=redis-cluster
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Notificaciones
NOTIFICATION_EMAIL_FROM=noreply@twentyonepilots.com
NOTIFICATION_PUSH_VAPID_KEY=your-vapid-key
NOTIFICATION_SMS_PROVIDER=twilio

# Rate limiting
FAVORITES_RATE_LIMIT=100
NOTIFICATIONS_RATE_LIMIT=50
```

### Escalabilidad

```javascript
// Configuración para múltiples instancias
const clusterConfig = {
  instances: 4,
  redis: {
    cluster: {
      enableOfflineQueue: false,
      redisOptions: redisConfig
    }
  },
  queues: {
    concurrency: {
      email: 10,
      notifications: 15,
      analytics: 5
    }
  }
};
```

## 📚 Documentación Adicional

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Documentación completa de endpoints
- **[Caching System](docs/CACHING_QUEUE_SYSTEM.md)** - Sistema de caché y colas
- **[Database Models](backend/models/)** - Modelos de datos detallados
- **[Services](backend/services/)** - Servicios backend con ejemplos

## 🎉 Conclusión

El sistema de favoritos y notificaciones implementado proporciona:

✅ **Experiencia de usuario excepcional** con interacciones fluidas  
✅ **Rendimiento óptimo** con Redis y estrategias de cache avanzadas  
✅ **Escalabilidad total** con procesamiento asíncrono via Bull  
✅ **Flexibilidad máxima** con múltiples canales de notificación  
✅ **Analytics completos** para insights de usuario y plataforma  
✅ **Seguridad robusta** con autenticación y validación  
✅ **Monitoreo proactivo** con métricas y alertas automáticas  

**🚀 ¡El sistema está completamente operativo y listo para manejar miles de usuarios concurrentes!**