# Documentación de la API - Twenty One Pilots Platform

## 📋 Información General

- **Base URL**: `https://api.twentyonepilots.com` (producción) / `http://localhost:5000` (desarrollo)
- **Versión**: 1.0.0
- **Autenticación**: JWT (Bearer Token)
- **Formato**: JSON

## 🔐 Autenticación

### Obtener Token JWT

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d5ecb74bbb4c001f8b4567",
      "username": "fan123",
      "email": "usuario@ejemplo.com",
      "role": "user"
    }
  }
}
```

### Usar Token en Requests

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👤 Endpoints de Autenticación

### Registro de Usuario

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "fan123",
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "60d5ecb74bbb4c001f8b4567",
      "username": "fan123",
      "email": "usuario@ejemplo.com",
      "role": "user"
    }
  }
}
```

### Obtener Perfil

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d5ecb74bbb4c001f8b4567",
      "username": "fan123",
      "email": "usuario@ejemplo.com",
      "role": "user",
      "playlists": ["60d5ecb74bbb4c001f8b4568"],
      "createdAt": "2023-06-25T10:30:00.000Z"
    }
  }
}
```

### Actualizar Perfil

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "nuevo_fan123",
  "email": "nuevo@ejemplo.com"
}
```

## 🎵 Endpoints de Discografía

### Obtener Álbumes

```http
GET /api/discography/albums?page=1&limit=10&sort=releaseYear&order=desc&search=trench
```

**Parámetros de Query:**
- `page` (integer): Número de página (default: 1)
- `limit` (integer): Elementos por página (default: 10, max: 100)
- `sort` (string): Campo para ordenar (title, releaseYear, createdAt)
- `order` (string): Orden (asc, desc)
- `search` (string): Término de búsqueda

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "albums": [
      {
        "id": "60d5ecb74bbb4c001f8b4567",
        "title": "Trench",
        "releaseYear": 2018,
        "coverImage": "https://example.com/trench.jpg",
        "songs": ["60d5ecb74bbb4c001f8b4568"],
        "createdAt": "2023-06-25T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pages": 3,
      "total": 25,
      "limit": 10
    }
  }
}
```

### Obtener Álbum Específico

```http
GET /api/discography/albums/60d5ecb74bbb4c001f8b4567
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "album": {
      "id": "60d5ecb74bbb4c001f8b4567",
      "title": "Trench",
      "releaseYear": 2018,
      "coverImage": "https://example.com/trench.jpg",
      "songs": [
        {
          "id": "60d5ecb74bbb4c001f8b4568",
          "title": "Jumpsuit",
          "duration": "3:58",
          "lyrics": "[Verse 1]\nDon't wanna be alone..."
        }
      ]
    }
  }
}
```

### Crear Álbum (Solo Admin)

```http
POST /api/discography/albums
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Nuevo Álbum",
  "releaseYear": 2024,
  "coverImage": "https://example.com/cover.jpg"
}
```

### Obtener Canciones

```http
GET /api/discography/songs?page=1&limit=20&album=60d5ecb74bbb4c001f8b4567&search=jumpsuit
```

**Parámetros:**
- `page`, `limit`, `search`: Igual que álbumes
- `album` (string): ID del álbum para filtrar

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "id": "60d5ecb74bbb4c001f8b4568",
        "title": "Jumpsuit",
        "lyrics": "[Verse 1]\nDon't wanna be alone...",
        "duration": "3:58",
        "album": {
          "id": "60d5ecb74bbb4c001f8b4567",
          "title": "Trench",
          "releaseYear": 2018
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pages": 5,
      "total": 85,
      "limit": 20
    }
  }
}
```

## 📹 Endpoints de Videos

### Buscar Videos

```http
GET /api/videos/search?q=twenty+one+pilots+jumpsuit&maxResults=10
```

**Parámetros:**
- `q` (string): Término de búsqueda
- `maxResults` (integer): Máximo de resultados (1-50, default: 10)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Twenty One Pilots - Jumpsuit (Official Video)",
      "description": "Official music video for Jumpsuit...",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "channelTitle": "Twenty One Pilots",
      "publishedAt": "2018-07-11T16:00:00Z",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ],
  "totalResults": 150
}
```

### Obtener Detalles de Video

```http
GET /api/videos/dQw4w9WgXcQ
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Twenty One Pilots - Jumpsuit (Official Video)",
    "description": "Official music video for Jumpsuit...",
    "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "channelTitle": "Twenty One Pilots",
    "publishedAt": "2018-07-11T16:00:00Z",
    "duration": "PT3M58S",
    "viewCount": 150000000,
    "likeCount": 2500000,
    "tags": ["twenty one pilots", "jumpsuit", "trench"],
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
  }
}
```

### Videos Relacionados

```http
GET /api/videos/dQw4w9WgXcQ/related?maxResults=5
```

## 🎪 Endpoints de Conciertos

### Buscar Conciertos

```http
GET /api/concerts/search?q=twenty+one+pilots&location=united+states&maxResults=20
```

**Parámetros:**
- `q` (string): Término de búsqueda
- `location` (string): Ubicación
- `maxResults` (integer): Máximo de resultados (1-50, default: 20)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123456789",
      "name": "Twenty One Pilots - The Icy Tour",
      "description": "Join Twenty One Pilots for an unforgettable night...",
      "url": "https://www.eventbrite.com/e/twenty-one-pilots-icy-tour-tickets-123456789",
      "start": {
        "timezone": "America/New_York",
        "local": "2024-08-15T19:00:00",
        "utc": "2024-08-15T23:00:00Z"
      },
      "end": {
        "timezone": "America/New_York",
        "local": "2024-08-15T23:00:00",
        "utc": "2024-08-16T03:00:00Z"
      },
      "venue": {
        "name": "Madison Square Garden",
        "address": {
          "city": "New York",
          "region": "NY",
          "country": "US"
        }
      },
      "isFree": false,
      "price": "$75.00 - $150.00"
    }
  ],
  "pagination": {
    "page_count": 3,
    "page_number": 1,
    "page_size": 20,
    "total_items": 45
  }
}
```

### Detalles de Concierto

```http
GET /api/concerts/123456789
```

### Buscar por Ubicación

```http
GET /api/concerts/location/search?location=new+york&radius=50&maxResults=10
```

**Parámetros:**
- `location` (string): Ciudad o dirección
- `radius` (integer): Radio en km (1-100, default: 50)
- `maxResults` (integer): Máximo de resultados

## 🎶 Endpoints de Playlists

### Obtener Playlists del Usuario

```http
GET /api/playlists/my?page=1&limit=10
Authorization: Bearer <token>
```

### Crear Playlist

```http
POST /api/playlists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mis favoritas de Trench",
  "description": "Las mejores canciones del álbum Trench",
  "isPublic": true,
  "songs": ["60d5ecb74bbb4c001f8b4568", "60d5ecb74bbb4c001f8b4569"]
}
```

### Agregar Canción a Playlist

```http
POST /api/playlists/60d5ecb74bbb4c001f8b4567/songs
Authorization: Bearer <token>
Content-Type: application/json

{
  "songId": "60d5ecb74bbb4c001f8b4568"
}
```

## 🛍️ Endpoints de Tienda

### Obtener Productos

```http
GET /api/store/products?category=merchandise&page=1&limit=12
```

### Detalles de Producto

```http
GET /api/store/products/60d5ecb74bbb4c001f8b4567
```

### Crear Pedido

```http
POST /api/store/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "60d5ecb74bbb4c001f8b4567",
      "quantity": 2,
      "size": "L",
      "color": "Black"
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  }
}
```

## 👥 Endpoints del Foro

### Obtener Posts

```http
GET /api/forum/posts?page=1&limit=20&category=general&sort=recent
```

### Crear Post

```http
POST /api/forum/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "¿Cuál es su canción favorita de Trench?",
  "content": "Para mí definitivamente es Jumpsuit...",
  "category": "discography",
  "tags": ["trench", "favorites", "discussion"]
}
```

### Responder a Post

```http
POST /api/forum/posts/60d5ecb74bbb4c001f8b4567/replies
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "¡Jumpsuit es increíble! La letra es tan profunda...",
  "parentReplyId": null
}
```

## 🔧 Endpoints Administrativos

### Estadísticas del Sistema

```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 15420,
      "activeToday": 1250,
      "newThisWeek": 450
    },
    "content": {
      "albums": 8,
      "songs": 85,
      "videos": 234,
      "events": 67
    },
    "engagement": {
      "forumPosts": 3250,
      "playlists": 890,
      "orders": 1250
    }
  }
}
```

### Gestión de Usuarios

```http
GET /api/admin/users?page=1&limit=20&search=john&role=user
Authorization: Bearer <admin_token>
```

### Moderación de Contenido

```http
PUT /api/admin/forum/posts/60d5ecb74bbb4c001f8b4567/moderate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "approve", // approve, reject, delete
  "reason": "Contenido apropiado"
}
```

## 📊 Códigos de Error

### Errores Comunes

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token requerido o inválido |
| 403 | Forbidden - Permisos insuficientes |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe |
| 422 | Unprocessable Entity - Validación fallida |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

### Estructura de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Rate Limiting

### Límites por Endpoint

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Autenticación | 5 requests | 15 minutos |
| APIs generales | 100 requests | 15 minutos |
| Búsqueda | 50 requests | 15 minutos |
| Creación de contenido | 20 requests | 15 minutos |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 900
```

## 📝 Webhooks

### Eventos Soportados

#### Nuevo Usuario Registrado
```json
{
  "event": "user.registered",
  "data": {
    "userId": "60d5ecb74bbb4c001f8b4567",
    "username": "fan123",
    "email": "usuario@ejemplo.com",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Nuevo Pedido
```json
{
  "event": "order.created",
  "data": {
    "orderId": "60d5ecb74bbb4c001f8b4568",
    "userId": "60d5ecb74bbb4c001f8b4567",
    "total": 89.99,
    "items": [...],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Configuración de Webhooks

```http
POST /api/admin/webhooks
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "url": "https://mi-app.com/webhooks",
  "events": ["user.registered", "order.created"],
  "secret": "mi_webhook_secret"
}
```

## 🔍 Versionado de API

### Versionado en URL
- **v1**: `https://api.twentyonepilots.com/v1/`
- **v2**: `https://api.twentyonepilots.com/v2/` (futuro)

### Headers de Versionado
```http
Accept: application/vnd.twentyonepilots.v1+json
X-API-Version: 1.0.0
```

## 📊 Monitoreo y Health Checks

### Health Check
```http
GET /api/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "youtube_api": "operational",
    "eventbrite_api": "operational"
  },
  "uptime": "15d 4h 23m"
}
```

### Métricas
```http
GET /api/metrics
Authorization: Bearer <admin_token>
```

---

Para más detalles técnicos, consulta la documentación completa en `/api-docs` cuando el servidor esté ejecutándose.