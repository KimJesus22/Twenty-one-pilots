# Twenty One Pilots Fan App

Aplicación web full-stack dedicada a Twenty One Pilots, ofreciendo una experiencia completa para fans con discografía, videos, conciertos, foro comunitario y más.

## 🚀 Características

- **🎵 Discografía Completa**: Explora todos los álbumes y canciones de Twenty One Pilots
- **🎥 Videos Oficiales**: Acceso a videos musicales desde YouTube
- **🎪 Conciertos**: Encuentra fechas de conciertos próximos via Eventbrite
- **💬 Foro de Fans**: Comunidad interactiva con hilos y comentarios
- **🎧 Playlists Personalizadas**: Crea y comparte tus playlists favoritas
- **🛍️ Tienda de Merchandise**: Productos oficiales con carrito de compras
- **🔐 Autenticación**: Sistema seguro con JWT
- **📱 Diseño Responsive**: Optimizado para móvil y desktop

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

## 📁 Estructura del Proyecto

```
twentyonepilots-app/
├── backend/
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Rutas de la API
│   ├── server.js        # Servidor principal
│   └── .env            # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas principales
│   │   └── App.js       # App principal
│   └── public/          # Archivos estáticos
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

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Twenty One Pilots por la inspiración musical
- MongoDB Atlas por la base de datos gratuita
- YouTube y Eventbrite por sus APIs
- La comunidad React por el framework

---

**Desarrollado con ❤️ para la comunidad de Twenty One Pilots**