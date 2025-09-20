# 📚 Documentación de la API - Twenty One Pilots App

## Descripción General

Esta documentación cubre la API REST completa de la aplicación Twenty One Pilots, incluyendo endpoints para videos, discografía, foro, autenticación y administración.

## Base URL
```
http://localhost:5000/api
```

## Autenticación

### JWT Token
La mayoría de los endpoints requieren autenticación mediante JWT token en el header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints Públicos
- `GET /health` - Health check
- `GET /api/videos/search` - Búsqueda de videos
- `GET /api/videos/popular` - Videos populares
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

## 🎥 Videos API

### Buscar Videos
Busca videos en YouTube relacionados con Twenty One Pilots.

```http
GET /api/videos/search
```

#### Parámetros Query
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `q` | string | No | Término de búsqueda (default: "Twenty One Pilots") |
| `maxResults` | number | No | Número máximo de resultados (1-50, default: 10) |
| `pageToken` | string | No | Token para paginación |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "VIDEO_ID",
      "title": "Twenty One Pilots - Song Title",
      "description": "Video description...",
      "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg",
      "channelTitle": "Twenty One Pilots",
      "channelId": "CHANNEL_ID",
      "publishedAt": "2024-01-01T00:00:00Z",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID",
      "embedUrl": "https://www.youtube.com/embed/VIDEO_ID"
    }
  ],
  "pagination": {
    "totalResults": 1000000,
    "nextPageToken": "NEXT_TOKEN",
    "prevPageToken": null
  }
}
```

#### Ejemplo de Uso
```bash
curl "http://localhost:5000/api/videos/search?q=Twenty%20One%20Pilots&maxResults=5"
```

### Obtener Detalles de Video
Obtiene información completa de un video específico.

```http
GET /api/videos/:id
```

#### Parámetros Path
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID del video de YouTube |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": "VIDEO_ID",
    "title": "Twenty One Pilots - Song Title",
    "description": "Complete video description...",
    "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
    "channelTitle": "Twenty One Pilots",
    "channelId": "CHANNEL_ID",
    "publishedAt": "2024-01-01T00:00:00Z",
    "duration": "PT4M13S",
    "durationSeconds": 253,
    "viewCount": 150000000,
    "likeCount": 12000000,
    "commentCount": 500000,
    "tags": ["twenty one pilots", "music", "alternative"],
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "embedUrl": "https://www.youtube.com/embed/VIDEO_ID"
  }
}
```

### Videos Populares
Obtiene videos populares de la base de datos.

```http
GET /api/videos/popular
```

#### Parámetros Query
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Número de videos (1-50) |
| `page` | number | 1 | Página de resultados |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Videos Recientes
Obtiene videos recientes ordenados por fecha de publicación.

```http
GET /api/videos/recent
```

#### Parámetros Query
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Número de videos (1-50) |
| `page` | number | 1 | Página de resultados |

### Videos de un Canal
Obtiene videos de un canal específico de YouTube.

```http
GET /api/videos/channel/:channelId
```

#### Parámetros Path
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `channelId` | string | ID del canal de YouTube |

#### Parámetros Query
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `maxResults` | number | 10 | Número máximo de resultados (1-50) |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [...],
  "channelInfo": {
    "id": "CHANNEL_ID",
    "title": "Twenty One Pilots",
    "description": "Official channel...",
    "thumbnail": "https://yt3.ggpht.com/...",
    "subscriberCount": 12000000,
    "videoCount": 150,
    "viewCount": 5000000000
  }
}
```

## 🎵 Discografía API

### Obtener Álbumes
Obtiene todos los álbumes disponibles.

```http
GET /api/discography/albums
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "album_id",
      "title": "Blurryface",
      "releaseYear": 2015,
      "coverImage": "https://example.com/cover.jpg",
      "songs": [
        {
          "_id": "song_id",
          "title": "Stressed Out",
          "duration": "3:22",
          "lyrics": "Lyrics content..."
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Crear Álbum
Crea un nuevo álbum (requiere autenticación admin).

```http
POST /api/discography/albums
```

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Body
```json
{
  "title": "Nuevo Álbum",
  "releaseYear": 2024,
  "coverImage": "https://example.com/cover.jpg"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "_id": "new_album_id",
    "title": "Nuevo Álbum",
    "releaseYear": 2024,
    "coverImage": "https://example.com/cover.jpg",
    "songs": [],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Álbum creado exitosamente"
}
```

### Obtener Canción
Obtiene detalles de una canción específica.

```http
GET /api/discography/songs/:id
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "_id": "song_id",
    "title": "Stressed Out",
    "duration": "3:22",
    "lyrics": "Lyrics content...",
    "album": {
      "_id": "album_id",
      "title": "Blurryface",
      "releaseYear": 2015
    }
  }
}
```

## 🗣️ Foro API

### Obtener Hilos
Obtiene todos los hilos del foro con paginación.

```http
GET /api/forum/threads
```

#### Parámetros Query
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Página de resultados |
| `limit` | number | 10 | Número de hilos por página (1-50) |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "thread_id",
      "title": "Nuevo hilo de discusión",
      "content": "Contenido del hilo...",
      "author": {
        "_id": "user_id",
        "username": "fan_user"
      },
      "comments": [
        {
          "_id": "comment_id",
          "content": "Comentario...",
          "author": {
            "_id": "user_id",
            "username": "fan_user"
          },
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ],
      "isPinned": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Crear Hilo
Crea un nuevo hilo en el foro (requiere autenticación).

```http
POST /api/forum/threads
```

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Body
```json
{
  "title": "Título del nuevo hilo",
  "content": "Contenido del hilo...",
  "authorId": "user_id"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "_id": "new_thread_id",
    "title": "Título del nuevo hilo",
    "content": "Contenido del hilo...",
    "author": {
      "_id": "user_id",
      "username": "fan_user"
    },
    "comments": [],
    "isPinned": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Hilo creado exitosamente"
}
```

### Agregar Comentario
Agrega un comentario a un hilo existente (requiere autenticación).

```http
POST /api/forum/threads/:id/comments
```

#### Parámetros Path
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID del hilo |

#### Body
```json
{
  "content": "Contenido del comentario...",
  "authorId": "user_id"
}
```

## 🔐 Autenticación API

### Registro de Usuario
Registra un nuevo usuario en el sistema.

```http
POST /api/auth/register
```

#### Body
```json
{
  "username": "fan_user",
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "fan_user",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Usuario registrado exitosamente"
}
```

### Login
Inicia sesión y obtiene JWT token.

```http
POST /api/auth/login
```

#### Body
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "fan_user",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  },
  "message": "Login exitoso"
}
```

### Perfil de Usuario
Obtiene información del usuario autenticado.

```http
GET /api/auth/profile
```

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "fan_user",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 🏥 Health Check API

### Estado del Sistema
Verifica el estado de salud del sistema.

```http
GET /health
```

#### Respuesta Exitosa (200)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 104857600,
    "heapTotal": 67108864,
    "heapUsed": 45000000,
    "external": 2000000
  },
  "version": "2.0.0",
  "environment": "development",
  "ssl": false,
  "protocol": "http",
  "host": "localhost:5000",
  "database": "connected"
}
```

## 📊 Estadísticas API

### Estadísticas del Servicio de Videos
Obtiene métricas del servicio de YouTube.

```http
GET /api/videos/stats/service
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "apiKeyConfigured": true,
    "dailyQuota": 10000,
    "dailyUsage": 150,
    "usagePercent": "1.50",
    "cacheSize": 25,
    "lastResetDate": "2024-01-01",
    "uptime": 3600,
    "memoryUsage": {
      "rss": 104857600,
      "heapTotal": 67108864,
      "heapUsed": 45000000
    },
    "version": "2.0.0"
  }
}
```

## ⚠️ Códigos de Error

### Errores Comunes

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido",
      "value": "invalid-email"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token de autenticación requerido"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "No tienes permisos para acceder a este recurso"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Recurso no encontrado"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Demasiadas solicitudes. Intente más tarde."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error interno del servidor"
}
```

## 🔒 Rate Limiting

La API implementa rate limiting para prevenir abuso:

- **General**: 100 requests por 15 minutos por IP
- **Autenticación**: 5 requests por 15 minutos por IP
- **Videos**: Sin límite adicional (controlado por YouTube API)
- **Headers de respuesta**:
  - `X-RateLimit-Limit`: Límite máximo
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## 📝 Notas Importantes

### Autenticación
- Usa JWT tokens con expiración de 24 horas
- Incluye el token en el header `Authorization: Bearer <token>`
- Los tokens deben refrescarse antes de expirar

### Paginación
- Usa `page` y `limit` para controlar resultados
- Los responses incluyen metadata de paginación
- Máximo 50 items por página

### Validación
- Todos los inputs son validados y sanitizados
- Errores de validación incluyen detalles específicos
- XSS y SQL injection prevention automática

### Caching
- Videos se cachean por 5 minutos
- Búsquedas se cachean por 10 minutos
- Cache se invalida automáticamente

### SSL/TLS
- HTTPS obligatorio en producción
- Certificados Let's Encrypt recomendados
- Configuración automática de SSL

Para más información sobre implementación específica, consulta la documentación de arquitectura o el código fuente.