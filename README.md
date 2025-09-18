# Twenty One Pilots Fan App

Aplicación web full-stack dedicada a Twenty One Pilots, ofreciendo una experiencia completa para fans con discografía, videos, conciertos, foro comunitario y más.

## 🚀 Características

- **🎵 Discografía Completa**: Explora todos los álbumes y canciones con detalles completos
- **🎥 Videos Oficiales**: Acceso directo a videos musicales desde YouTube API
- **🎪 Conciertos**: Encuentra fechas de conciertos próximos via Eventbrite API
- **💬 Foro de Fans**: Comunidad interactiva con hilos, comentarios y moderación
- **🎧 Playlists Sociales**: Crea, edita, comparte y colabora en playlists con sistema de likes
- **⭐ Sistema de Favoritos**: Marca álbumes como favoritos y sigue a tus artistas preferidos
- **👥 Playlists Colaborativas**: Trabaja en playlists con otros usuarios
- **🔗 Compartir Contenido**: URLs únicas para compartir playlists públicas
- **🛍️ Tienda de Merchandise**: Catálogo completo con carrito de compras y checkout
- **🔐 Sistema de Roles**: Autenticación JWT con roles admin/user y permisos granulares
- **📱 Diseño Responsive**: Optimizado para móvil y desktop con diseño minimalista

## 🛠️ Tecnologías

### Backend
- **Node.js** con **Express.js**
- **MongoDB** (Atlas para producción)
- **JWT** para autenticación
- **Mongoose** para modelado de datos
- APIs externas: YouTube Data API, Eventbrite API

### Frontend
- **React** con **React Router**
- **Axios** para llamadas HTTP
- Diseño minimalista con colores rojo/negro
- **CSS Grid/Flexbox** para layouts responsive

### Seguridad y Validación
- **JWT** con middleware de roles (admin/user)
- **Joi** para validaciones de entrada
- **Helmet** para headers de seguridad
- **Rate limiting** para protección contra abuso
- **bcryptjs** para hash de contraseñas

### Características Sociales
- Sistema de **favoritos many-to-many**
- **Playlists colaborativas** con permisos
- **Sistema de likes** y compartir
- **URLs únicas** para compartir contenido
- **Seguimiento de artistas**

## 📋 Prerrequisitos

- Node.js (v14 o superior)
- MongoDB Atlas account (gratuito)
- YouTube Data API key
- Eventbrite API key

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd twentyonepilots-app
```

### 2. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env` en `backend/`:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/twentyonepilots
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
YOUTUBE_API_KEY=your_youtube_api_key
EVENTBRITE_API_KEY=your_eventbrite_api_key
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```

### 4. Ejecutar la aplicación

#### Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Servidor corriendo en: `http://localhost:5000`

#### Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Aplicación corriendo en: `http://localhost:3000`

#### Servidor Python Alternativo
```bash
python server.py
```
Servidor corriendo en: `http://localhost:8000` (sirve archivos estáticos del frontend)

## 📁 Estructura del Proyecto

```
twentyonepilots-app/
├── backend/
│   ├── models/          # Modelos de MongoDB
│   │   ├── User.js      # Modelo de usuario
│   │   ├── Discography.js # Modelos de álbumes/canciones
│   │   ├── Playlist.js  # Modelo de playlists
│   │   ├── Forum.js     # Modelos de foro
│   │   └── Product.js   # Modelo de productos
│   ├── routes/          # Rutas de la API
│   │   ├── auth.js      # Autenticación JWT
│   │   ├── admin.js     # CRUD administrativo
│   │   ├── discography.js # Discografía
│   │   ├── videos.js    # Videos (YouTube)
│   │   ├── concerts.js  # Conciertos (Eventbrite)
│   │   ├── forum.js     # Foro de fans
│   │   ├── playlists.js # Playlists sociales
│   │   ├── favorites.js # Sistema de favoritos
│   │   └── store.js     # Tienda
│   ├── middleware/      # Middleware personalizado
│   │   └── auth.js      # Autenticación y roles
│   ├── validations/     # Validaciones con Joi
│   │   └── schemas.js   # Esquemas de validación
│   ├── config/          # Configuración
│   │   └── production.js # Config producción
│   ├── tests/           # Tests automatizados
│   │   └── auth.test.js # Tests de autenticación
│   ├── server.js        # Servidor principal
│   └── .env            # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   │   ├── Navbar.js/css # Navegación
│   │   ├── pages/       # Páginas principales
│   │   │   ├── Home.js/css     # Página principal
│   │   │   ├── Discography.js/css # Discografía
│   │   │   ├── Videos.js/css   # Videos
│   │   │   ├── Concerts.js/css # Conciertos
│   │   │   ├── Forum.js/css    # Foro
│   │   │   ├── Playlists.js/css # Playlists
│   │   │   └── Store.js/css    # Tienda
│   │   └── App.js       # App principal
│   └── public/          # Archivos estáticos
├── server.py           # Servidor Python alternativo
└── README.md
```

## 🔧 APIs Disponibles

### Discografía
- `GET /api/discography/albums` - Lista de álbumes
- `GET /api/discography/albums/:id` - Detalles de álbum
- `GET /api/discography/songs` - Lista de canciones

### Videos
- `GET /api/videos/search?q=query` - Buscar videos
- `GET /api/videos/:id` - Detalles de video

### Conciertos
- `GET /api/concerts/search?q=query` - Buscar conciertos
- `GET /api/concerts/:id` - Detalles de concierto

### Foro
- `GET /api/forum/threads` - Lista de hilos
- `POST /api/forum/threads` - Crear hilo
- `POST /api/forum/threads/:id/comments` - Agregar comentario

### Playlists
- `GET /api/playlists/user/:userId` - Playlists del usuario
- `POST /api/playlists` - Crear playlist
- `PUT /api/playlists/:id` - Actualizar playlist
- `DELETE /api/playlists/:id` - Eliminar playlist
- `POST /api/playlists/:id/songs` - Agregar canción
- `DELETE /api/playlists/:id/songs/:songId` - Quitar canción
- `GET /api/playlists/public/all` - Playlists públicas
- `POST /api/playlists/:id/like` - Dar/quitar like a playlist
- `GET /api/playlists/:id/share` - Obtener URL de compartir
- `GET /api/playlists/shared/:shareUrl` - Acceder por URL compartida
- `POST /api/playlists/:id/collaborators` - Agregar colaborador
- `GET /api/playlists/popular/all` - Playlists más populares

### Favoritos
- `GET /api/favorites` - Obtener favoritos del usuario
- `POST /api/favorites/albums/:albumId` - Agregar álbum a favoritos
- `DELETE /api/favorites/albums/:albumId` - Remover álbum de favoritos
- `GET /api/favorites/albums/:albumId/status` - Verificar si está en favoritos
- `POST /api/favorites/artists/:artistName` - Seguir artista
- `DELETE /api/favorites/artists/:artistName` - Dejar de seguir artista
- `GET /api/favorites/artists` - Obtener artistas seguidos
- `GET /api/favorites/artists/:artistName/status` - Verificar seguimiento

### Tienda
- `GET /api/store/products` - Lista de productos
- `GET /api/store/products/:id` - Detalles de producto
- `GET /api/store/categories` - Categorías disponibles
- `POST /api/store/checkout` - Procesar compra

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario

## 🎨 Diseño

El diseño sigue la estética de Twenty One Pilots con:
- Colores principales: Rojo (#ff0000) y Negro (#000)
- Tipografía minimalista
- Layouts responsive
- Animaciones sutiles en hover

## 🚀 Despliegue

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Desplegar carpeta build/ en hosting estático
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📊 Estado del Proyecto

- ✅ **Backend avanzado**: APIs RESTful completas, autenticación JWT con roles, integración MongoDB
- ✅ **Sistema de roles**: Middleware de autorización, CRUD administrativo, validaciones Joi
- ✅ **Playlists sociales**: Likes, compartir, colaborativas, URLs únicas, contador de reproducciones
- ✅ **Sistema de favoritos**: Many-to-many con álbumes y seguimiento de artistas
- ✅ **Frontend funcional**: React con routing, diseño responsive minimalista
- ✅ **Características principales**: Discografía, videos, conciertos, foro, playlists, tienda
- 🔄 **Próximos pasos**: PWA, notificaciones push, geolocalización, mapas interactivos
- 🔄 **Mejoras futuras**: Integración Spotify/Apple Music, paginación avanzada, Redis caché

##  Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Twenty One Pilots por la inspiración musical
- MongoDB Atlas por la base de datos gratuita
- YouTube y Eventbrite por sus APIs
- La comunidad React por el framework

---

**Desarrollado con ❤️ para la comunidad de Twenty One Pilots**