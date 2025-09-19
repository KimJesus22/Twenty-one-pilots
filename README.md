# 🎵 Twenty One Pilots - Fan Application

[![CI/CD Pipeline](https://github.com/your-username/twentyonepilots-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/twentyonepilots-app/actions/workflows/ci-cd.yml)
[![Coverage](https://codecov.io/gh/your-username/twentyonepilots-app/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/twentyonepilots-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-20.81.227.69-blue)](http://20.81.227.69/)

# 🎵 Twenty One Pilots - Fan Application

**🚀 [APLICACIÓN EN VIVO](http://20.81.227.69/)** | **[📚 DOCUMENTACIÓN API](http://20.81.227.69/api-docs)**

Una aplicación web completa para fans de Twenty One Pilots con características avanzadas de música, comunidad y contenido interactivo.

## ✨ Características Principales

### 🎶 Gestión de Música
- **Discografía completa** con álbumes, canciones y letras
- **Búsqueda avanzada** por artista, álbum y canción
- **Playlists personalizadas** con sistema social
- **Integración con YouTube** para videos oficiales
- **Sistema de favoritos** y seguimiento

### 🎪 Conciertos y Eventos
- **Búsqueda de conciertos** con Eventbrite API
- **Mapas interactivos** con geolocalización
- **Calendario de Google** integrado
- **Notificaciones push** para eventos próximos
- **Reseñas y curiosidades** de conciertos

### 👥 Comunidad
- **Foro de fans** con hilos y comentarios
- **Sistema de usuarios** con autenticación JWT
- **Perfiles sociales** con playlists públicas
- **Sistema de likes** y compartir
- **Moderación de contenido**

### 🛠️ Características Técnicas
- **API REST completa** con 25+ endpoints
- **Documentación Swagger** interactiva
- **Tests automatizados** con 80% cobertura
- **Cache Redis** para optimización
- **Logging profesional** con Winston
- **CI/CD** con GitHub Actions
- **Despliegue PM2** para producción

## 🚀 Inicio Rápido

### 🌐 **APLICACIÓN EN PRODUCCIÓN**
- **Frontend**: http://20.81.227.69/
- **API Backend**: http://20.81.227.69/api
- **Documentación Swagger**: http://20.81.227.69/api-docs

### 💻 **Desarrollo Local**

#### Prerrequisitos
- Node.js 18+
- MongoDB Atlas (gratuito)
- Redis (opcional para cache)
- Git

#### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/your-username/twentyonepilots-app.git
   cd twentyonepilots-app
   ```

2. **Configurar Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Configurar Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configurar Base de Datos**
   - Crear cuenta en [MongoDB Atlas](https://cloud.mongodb.com)
   - Obtener connection string
   - Actualizar `MONGO_URI` en `.env`

5. **Ejecutar la aplicación**
   ```bash
   # Backend (desde /backend)
   npm run dev

   # Frontend (desde /frontend)
   npm start
   ```

## 📋 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Discografía
- `GET /api/discography/albums` - Lista de álbumes
- `GET /api/discography/songs` - Lista de canciones
- `GET /api/videos/search` - Búsqueda de videos
- `GET /api/concerts/search` - Búsqueda de conciertos

### Comunidad
- `GET /api/forum/posts` - Posts del foro
- `GET /api/playlists` - Playlists públicas
- `GET /api/favorites` - Favoritos del usuario

## 🧪 Testing

```bash
# Ejecutar todos los tests
cd backend && npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📚 Documentación

- **API Docs**: http://localhost:5000/api-docs
- **Tests**: `backend/README_TESTS.md`
- **Arquitectura**: `docs/architecture.md`

## 🔧 Configuración de Producción

### Variables de Entorno
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
YOUTUBE_API_KEY=your_api_key
EVENTBRITE_API_KEY=your_api_key
```

### Despliegue
```bash
cd backend
chmod +x deploy.sh
./deploy.sh production
```

## 🏗️ Arquitectura

```
twentyonepilots-app/
├── backend/                 # API Node.js/Express
│   ├── models/             # Modelos Mongoose
│   ├── routes/             # Endpoints API
│   ├── middleware/         # Middlewares personalizados
│   ├── services/           # Servicios (email, cache, etc.)
│   ├── tests/              # Tests automatizados
│   └── logs/               # Logs de aplicación
├── frontend/               # React App
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   └── services/       # Servicios frontend
│   └── public/             # Assets estáticos
└── .github/
    └── workflows/          # CI/CD pipelines
```

## 🔒 Seguridad

- **Autenticación JWT** con refresh tokens
- **Rate limiting** para prevenir abuso
- **Helmet** para headers de seguridad
- **Validación de entrada** con Joi
- **Encriptación** de contraseñas con bcrypt
- **CORS** configurado
- **Auditoría** de acciones de usuario

## 🌐 **APLICACIÓN EN PRODUCCIÓN**

### **🚀 URLs Activas**
- **Frontend Principal**: http://20.81.227.69/
- **API Backend**: http://20.81.227.69/api
- **Documentación Swagger**: http://20.81.227.69/api-docs
- **Health Check**: http://20.81.227.69/health

### **📊 Estado del Sistema**
- ✅ **Backend**: Node.js/Express corriendo
- ✅ **Base de datos**: MongoDB Atlas conectada
- ✅ **Cache**: Redis operativo
- ✅ **API**: 25+ endpoints funcionales
- ✅ **Documentación**: Swagger completa
- ✅ **Tests**: Cobertura 80%+
- ✅ **CI/CD**: GitHub Actions activo

### **🔧 Tecnologías en Producción**
- **Servidor**: VPS Ubuntu 22.04
- **Runtime**: Node.js 18 LTS
- **Base de datos**: MongoDB Atlas (gratuito)
- **Cache**: Redis 7
- **Gestión de procesos**: PM2
- **Logging**: Winston con rotación diaria
- **Monitoreo**: PM2 monitoring

## 📊 Monitoreo

- **PM2** para gestión de procesos
- **Winston** para logging estructurado
- **Health checks** automáticos
- **Métricas de rendimiento**
- **Alertas por Slack**

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Twenty One Pilots por la inspiración musical
- MongoDB Atlas por la base de datos gratuita
- YouTube y Eventbrite por las APIs
- La comunidad open source

## 📞 Contacto

- **Autor**: [Tu Nombre]
- **Email**: tu@email.com
- **GitHub**: [@tu-usuario](https://github.com/tu-usuario)
- **LinkedIn**: [Tu Perfil](https://linkedin.com/in/tu-perfil)

---

⭐ **Si te gusta este proyecto, dale una estrella en GitHub!**