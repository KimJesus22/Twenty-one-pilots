# Twenty One Pilots Fan Platform

Una plataforma web completa para fans de Twenty One Pilots que incluye discografía, videos, conciertos, foro de fans, playlists personalizadas y tienda de merchandize.

## 🚀 Características

### 🎵 Discografía Completa
- Exploración de todos los álbumes y canciones
- Letras de canciones con búsqueda avanzada
- Información detallada de cada track

### 📹 Videos Oficiales
- Integración con YouTube API
- Videos musicales y contenido oficial
- Búsqueda y filtros por artista

### 🎪 Conciertos y Eventos
- Integración con Eventbrite API
- Calendario de conciertos próximos
- Información de venues y tickets
- Geolocalización y mapas interactivos

### 👥 Comunidad de Fans
- Foro de discusión moderado
- Sistema de usuarios con autenticación JWT
- Perfiles de usuario personalizables

### 🎶 Playlists Personalizadas
- Creación de playlists colaborativas
- Sistema de recomendaciones
- Compartir con otros fans

### 🛍️ Tienda de Merchandize
- Catálogo de productos oficiales
- Carrito de compras integrado
- Sistema de pagos seguro

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con **Express.js**
- **MongoDB** con **Mongoose**
- **JWT** para autenticación
- **Winston** para logging
- **Swagger/OpenAPI** para documentación

### Frontend
- **React** con **React Router**
- **Material-UI** para componentes
- **Axios** para llamadas HTTP
- **PWA** (Progressive Web App)

### APIs Externas
- **YouTube Data API v3**
- **Eventbrite API**
- **Google Maps API** (opcional)

### DevOps & Calidad
- **Docker** para contenerización
- **Jest** para testing
- **ESLint** para linting
- **GitHub Actions** para CI/CD

## 📋 Requisitos Previos

- Node.js 16+
- MongoDB (local o Atlas)
- NPM o Yarn
- Git

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/twenty-one-pilots-platform.git
cd twenty-one-pilots-platform
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta backend:
```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/twentyonepilots
# O para MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/twentyonepilots

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=7d

# APIs Externas
YOUTUBE_API_KEY=tu_youtube_api_key
EVENTBRITE_API_KEY=tu_eventbrite_api_key

# Servidor
PORT=5000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Configurar el Frontend

```bash
cd ../frontend
npm install
```

### 4. Ejecutar la aplicación

#### Backend:
```bash
cd backend
npm run dev
```

#### Frontend:
```bash
cd frontend
npm start
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Documentación API**: http://localhost:5000/api-docs

## 📖 Documentación de la API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Obtener perfil (requiere auth)
- `PUT /api/auth/profile` - Actualizar perfil (requiere auth)

#### Discografía
- `GET /api/discography/albums` - Lista de álbumes con paginación
- `GET /api/discography/albums/:id` - Detalles de álbum específico
- `GET /api/discography/songs` - Lista de canciones
- `GET /api/discography/songs/:id` - Detalles de canción específica

#### Videos
- `GET /api/videos/search` - Buscar videos en YouTube
- `GET /api/videos/:id` - Detalles de video específico
- `GET /api/videos/:id/related` - Videos relacionados

#### Conciertos
- `GET /api/concerts/search` - Buscar conciertos
- `GET /api/concerts/:id` - Detalles de concierto específico
- `GET /api/concerts/location/search` - Buscar por ubicación

### Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Para acceder a endpoints protegidos:

1. Obtener token mediante login: `POST /api/auth/login`
2. Incluir token en header: `Authorization: Bearer <token>`

## 🏗️ Arquitectura

```
twenty-one-pilots-platform/
├── backend/
│   ├── controllers/     # Lógica de negocio
│   ├── models/         # Modelos de MongoDB
│   ├── routes/         # Definición de rutas
│   ├── services/       # Servicios externos (APIs)
│   ├── middleware/     # Middleware personalizado
│   ├── utils/          # Utilidades (logger, etc.)
│   ├── validations/    # Validaciones con Joi
│   └── tests/          # Tests automatizados
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas de la aplicación
│   │   ├── services/   # Servicios para llamadas API
│   │   └── utils/      # Utilidades del frontend
│   └── public/         # Archivos estáticos
└── docs/               # Documentación adicional
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Cobertura de Tests
```bash
# Backend
npm run test:coverage

# Frontend
npm run test:coverage
```

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
npm run dev

# Frontend
npm start
```

### Producción
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm run serve
```

### Docker
```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up

# Ejecutar en background
docker-compose up -d
```

## 🔒 Seguridad

- **Autenticación JWT** con expiración configurable
- **Rate limiting** para prevenir ataques DoS
- **Helmet** para headers de seguridad HTTP
- **Validación de entrada** con express-validator
- **Encriptación de contraseñas** con bcrypt
- **CORS** configurado para orígenes específicos

## 📱 PWA (Progressive Web App)

La aplicación incluye características PWA:
- **Service Worker** para caching offline
- **Manifest.json** para instalación
- **Notificaciones push** (opcional)
- **Responsive design** para móviles

## ♿ Accesibilidad (WCAG 2.1 AA)

- **Navegación por teclado** completa
- **Lectores de pantalla** soportados
- **Alto contraste** disponible
- **Etiquetas ARIA** en componentes
- **Skip links** para navegación rápida
- **Focus management** adecuado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución
- Seguir estándares de código ESLint
- Escribir tests para nuevas funcionalidades
- Actualizar documentación según cambios
- Usar commits convencionales

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [Tu GitHub](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Twenty One Pilots por la inspiración
- Comunidad de fans por el apoyo
- Contribuidores de código abierto utilizados

## 📞 Contacto

- **Email**: tu-email@ejemplo.com
- **GitHub**: [https://github.com/tu-usuario/twenty-one-pilots-platform](https://github.com/tu-usuario)
- **Discord**: [Servidor de la comunidad](https://discord.gg/ejemplo)

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!