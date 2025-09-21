# Integración de la API de Spotify

Esta documentación describe la integración completa de la API Web de Spotify en el backend de la aplicación Twenty One Pilots.

## Configuración del Entorno

### 1. Variables de Entorno

Agrega las siguientes variables al archivo `.env` en el directorio `backend/`:

```env
# Spotify API Credentials
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
SPOTIFY_REDIRECT_URI=http://localhost:5000/api/spotify/callback
```

**Nota de Seguridad:** Nunca commits las credenciales reales al repositorio. Usa variables de entorno y agrega `.env` al `.gitignore`.

### 2. Dependencias

La integración requiere la librería `spotify-web-api-node`. Ya está instalada en el proyecto.

```bash
npm install spotify-web-api-node
```

### 3. Credenciales de Spotify

Para obtener las credenciales:

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
3. Copia el Client ID y Client Secret
4. Configura el Redirect URI en la aplicación de Spotify

## Arquitectura de la Integración

### Servicio Spotify (`backend/services/spotifyService.js`)

Clase singleton que maneja todas las interacciones con la API de Spotify:

- **Autenticación OAuth 2.0**
- **Gestión de tokens de acceso**
- **Métodos para obtener datos de tracks, playlists, etc.**
- **Manejo de errores y rate limiting**

### Rutas de API (`backend/routes/spotify.js`)

Endpoints REST para interactuar con Spotify:

- `GET /api/spotify/authorize` - Genera URL de autorización
- `POST /api/spotify/callback` - Intercambia código por tokens
- `POST /api/spotify/refresh-token` - Refresca token de acceso
- `GET /api/spotify/me` - Obtiene perfil del usuario
- `GET /api/spotify/playlists` - Lista playlists del usuario
- `GET /api/spotify/playlists/:id` - Detalles de una playlist
- `GET /api/spotify/tracks/:id` - Metadata de una pista
- `GET /api/spotify/tracks/:id/audio-features` - Features de audio
- `GET /api/spotify/search` - Búsqueda en Spotify
- `GET /api/spotify/recommendations` - Recomendaciones

## Flujo de Autenticación

### 1. Autorización del Usuario

```javascript
// Frontend - Redirigir al usuario a Spotify
const response = await fetch('/api/spotify/authorize');
const { authorizeURL } = await response.json();
window.location.href = authorizeURL;
```

### 2. Callback y Tokens

```javascript
// Después de que el usuario autorice, Spotify redirige con código
const response = await fetch('/api/spotify/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
});
const { tokens } = await response.json();
```

### 3. Usar la API

```javascript
// Todas las rutas requieren autenticación previa
const response = await fetch('/api/spotify/me');
const { data: profile } = await response.json();
```

## Ejemplos de Uso

### Obtener Metadata de una Pista

```javascript
const trackId = '4iV5W9uYEdYUVa79Axb7Rh'; // ID de Spotify
const response = await fetch(`/api/spotify/tracks/${trackId}`);
const { data: track } = await response.json();

console.log(track);
// {
//   id: '4iV5W9uYEdYUVa79Axb7Rh',
//   name: 'Stressed Out',
//   artists: [{ id: '...', name: 'Twenty One Pilots' }],
//   album: { id: '...', name: 'Blurryface', images: [...] },
//   duration_ms: 202333,
//   popularity: 85,
//   ...
// }
```

### Obtener Features de Audio

```javascript
const response = await fetch(`/api/spotify/tracks/${trackId}/audio-features`);
const { data: features } = await response.json();

console.log(features);
// {
//   danceability: 0.734,
//   energy: 0.637,
//   key: 4,
//   loudness: -7.817,
//   mode: 0,
//   speechiness: 0.141,
//   acousticness: 0.0462,
//   instrumentalness: 0.0000003,
//   liveness: 0.0602,
//   valence: 0.582,
//   tempo: 169.977,
//   ...
// }
```

### Buscar en Spotify

```javascript
const response = await fetch('/api/spotify/search?q=twenty%20one%20pilots&type=track&limit=10');
const { data: results } = await response.json();

console.log(results.tracks.items);
```

### Obtener Recomendaciones

```javascript
const response = await fetch('/api/spotify/recommendations?seed_tracks=4iV5W9uYEdYUVa79Axb7Rh&limit=5');
const { data: recommendations } = await response.json();

console.log(recommendations.tracks);
```

### Obtener Playlists del Usuario

```javascript
const response = await fetch('/api/spotify/playlists?limit=20');
const { data: playlists } = await response.json();

console.log(playlists.items);
```

## Manejo de Errores

### Rate Limiting

La API de Spotify tiene límites de rate. El servicio incluye manejo automático:

- **429 Too Many Requests**: Espera automática antes de reintentar
- Logging de eventos de rate limit
- Headers informativos en respuestas

### Expiración de Tokens

- **401 Unauthorized**: Intento automático de refresh del token
- Si falla, requiere nueva autorización del usuario
- Logging de eventos de expiración

### Errores de API

```javascript
try {
  const response = await fetch('/api/spotify/tracks/invalid-id');
  const result = await response.json();

  if (!result.success) {
    console.error('Error:', result.message);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Mejores Prácticas de Seguridad

### 1. Almacenamiento de Credenciales

- ✅ Usa variables de entorno
- ✅ Nunca hardcodea credenciales en el código
- ✅ Agrega `.env` al `.gitignore`

### 2. Manejo de Tokens

- ✅ Almacena tokens de forma segura (no en localStorage del frontend)
- ✅ Implementa refresh automático de tokens
- ✅ Valida tokens antes de usarlos

### 3. Rate Limiting

- ✅ Respeta los límites de la API de Spotify
- ✅ Implementa backoff exponencial en reintentos
- ✅ Monitorea uso de la API

### 4. Validación de Datos

- ✅ Valida todos los inputs del usuario
- ✅ Sanitiza queries de búsqueda
- ✅ Valida IDs de Spotify antes de enviar a la API

### 5. Logging y Monitoreo

- ✅ Loggea errores sin exponer información sensible
- ✅ Monitorea uso de la API
- ✅ Alerta sobre rate limits o errores persistentes

## Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/spotify/authorize` | Genera URL de autorización OAuth |
| POST | `/api/spotify/callback` | Intercambia código por tokens |
| POST | `/api/spotify/refresh-token` | Refresca token de acceso |

### Datos del Usuario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/spotify/me` | Perfil del usuario autenticado |
| GET | `/api/spotify/playlists` | Playlists del usuario |

### Contenido de Spotify

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/spotify/playlists/:id` | Detalles de una playlist |
| GET | `/api/spotify/tracks/:id` | Metadata de una pista |
| GET | `/api/spotify/tracks/:id/audio-features` | Features de audio |
| GET | `/api/spotify/search` | Búsqueda general |
| GET | `/api/spotify/recommendations` | Recomendaciones |

## Troubleshooting

### Error: "Token inválido"

1. Verifica que el usuario haya completado el flujo de autorización
2. Intenta refrescar el token con `/api/spotify/refresh-token`
3. Si falla, reinicia el flujo de autorización

### Error: "Rate limit excedido"

1. Espera el tiempo indicado en `Retry-After` header
2. Reduce la frecuencia de requests
3. Implementa cache para evitar requests repetidas

### Error: "Invalid client"

1. Verifica que las credenciales en `.env` sean correctas
2. Confirma que la aplicación esté registrada en Spotify Developer Dashboard
3. Asegúrate de que el Redirect URI coincida

## Consideraciones de Producción

### 1. Cache

Implementa cache para reducir llamadas a la API:

```javascript
// Ejemplo con Redis (ya disponible en el proyecto)
const cachedTrack = await redis.get(`spotify_track_${trackId}`);
if (!cachedTrack) {
  const track = await spotifyService.getTrack(trackId);
  await redis.setex(`spotify_track_${trackId}`, 3600, JSON.stringify(track)); // 1 hora
}
```

### 2. Monitoreo

- Monitorea uso de la API de Spotify
- Alerta sobre errores persistentes
- Trackea métricas de rendimiento

### 3. Escalabilidad

- Implementa circuit breakers para fallos de la API externa
- Usa colas para requests pesados
- Considera límites por usuario para evitar abuso

## Recursos Adicionales

- [Documentación de la API de Spotify](https://developer.spotify.com/documentation/web-api/)
- [Guía de autorización OAuth 2.0](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Límites de rate de Spotify](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)

---

**Nota:** Esta integración está diseñada para ser extensible. Si necesitas agregar más funcionalidades de Spotify, extiende el servicio `SpotifyService` y agrega nuevas rutas según sea necesario.