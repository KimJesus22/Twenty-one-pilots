# 🎵 Twenty One Pilots - Fan Application

[![CI/CD Pipeline](https://github.com/your-username/twentyonepilots-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/twentyonepilots-app/actions/workflows/ci-cd.yml)
[![Coverage](https://codecov.io/gh/your-username/twentyonepilots-app/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/twentyonepilots-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-20.81.227.69-blue)](http://20.81.227.69/)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger-green)](http://20.81.227.69/api-docs)

# 🚀 [APLICACIÓN EN VIVO](http://20.81.227.69/) | [📚 DOCUMENTACIÓN API](http://20.81.227.69/api-docs)

Una aplicación web completa y profesional para fans de Twenty One Pilots, construida con las mejores prácticas de desarrollo moderno. Explora la discografía completa, descubre videos oficiales, encuentra conciertos próximos y conecta con la comunidad de fans.

## ✨ Características Principales

### 🎶 **Gestión Musical Completa**
- **📀 Discografía completa** con álbumes, canciones y letras detalladas
- **🎵 Sistema de playlists** sociales con likes, compartir y colaboración
- **⭐ Sistema de favoritos** y seguimiento personalizado de álbumes
- **🔍 Búsqueda avanzada** por artista, álbum y canción
- **📊 Estadísticas** de reproducción y popularidad

### 🎪 **Conciertos y Eventos**
- **📅 Calendario integrado** con Google Calendar
- **🗺️ Mapas interactivos** con geolocalización y rutas
- **📍 Geolocalización** automática para eventos cercanos
- **⭐ Sistema de reseñas** y calificaciones de conciertos
- **🎫 Integración con Eventbrite** para tickets oficiales
- **💡 Curiosidades y anécdotas** de conciertos históricos

### 👥 **Comunidad Interactiva**
- **💬 Foro de fans** con hilos, comentarios y moderación
- **👤 Sistema de usuarios** con autenticación JWT y roles
- **🤝 Playlists colaborativas** entre usuarios
- **🔔 Notificaciones push** y emails automáticos
- **📱 Perfiles sociales** con actividad y estadísticas

### 🛠️ **Características Técnicas Avanzadas**
- **🔐 Sistema de roles** (admin/user) con middleware de autorización
- **✅ Validaciones Joi** completas para todos los inputs
- **📄 Paginación y ordenamiento** avanzado en todas las APIs
- **⚡ Cache Redis** para optimización de rendimiento
- **📝 Logging profesional** con Winston y rotación automática
- **🔄 CI/CD completo** con GitHub Actions y Dependabot
- **🧪 Tests automatizados** con Jest y 80% cobertura
- **📚 Documentación Swagger/OpenAPI** interactiva completa

## 🌐 **APLICACIÓN EN PRODUCCIÓN**

### **🚀 URLs Activas**
- **🏠 Frontend Principal**: http://20.81.227.69/
- **🔧 API Backend**: http://20.81.227.69/api
- **📖 Documentación Swagger**: http://20.81.227.69/api-docs
- **💚 Health Check**: http://20.81.227.69/health

### **📊 Estado del Sistema**
- ✅ **Backend**: Node.js/Express corriendo con PM2
- ✅ **Base de datos**: MongoDB Atlas conectada y operativa
- ✅ **Cache**: Redis 7 funcionando perfectamente
- ✅ **API**: 25+ endpoints completamente funcionales
- ✅ **Documentación**: Swagger con testing interactivo
- ✅ **Tests**: Cobertura del 80%+ ejecutándose automáticamente
- ✅ **CI/CD**: GitHub Actions procesando cada commit
- ✅ **Monitoreo**: Winston logging con rotación diaria

### **🔧 Tecnologías en Producción**
- **🖥️ Servidor**: VPS Ubuntu 22.04 con 2GB RAM
- **⚙️ Runtime**: Node.js 18 LTS optimizado
- **🗄️ Base de datos**: MongoDB Atlas (cluster gratuito)
- **💾 Cache**: Redis 7 para alta performance
- **🎯 Gestión de procesos**: PM2 con clustering
- **📋 Logging**: Winston con archivos rotativos
- **🔍 Monitoreo**: PM2 monitoring y health checks
- **🚀 Despliegue**: Automatizado con GitHub Actions

## 🚀 **Inicio Rápido**

### **🌐 Ver la App en Vivo (Sin Instalación)**
Solo necesitas un navegador web moderno:
1. Ve a **[http://20.81.227.69/](http://20.81.227.69/)**
2. Explora la interfaz de usuario
3. Revisa la **[documentación API](http://20.81.227.69/api-docs)** para desarrolladores
4. Prueba los endpoints directamente desde Swagger

### **💻 Desarrollo Local**

#### Prerrequisitos
- Node.js 18+
- MongoDB Atlas (gratuito)
- Redis (opcional para desarrollo local)
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

4. **Ejecutar la aplicación**
   ```bash
   # Backend (desde /backend)
   npm run dev

   # Frontend (desde /frontend)
   npm start
   ```

## 📋 **API Endpoints**

### **🔐 Autenticación**
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### **🎵 Discografía**
- `GET /api/discography/albums` - Lista de álbumes con paginación
- `GET /api/discography/albums/:id` - Detalles de álbum específico
- `GET /api/discography/songs` - Lista de canciones
- `GET /api/discography/songs/:id` - Detalles de canción específica

### **🎥 Videos**
- `GET /api/videos/search` - Búsqueda de videos en YouTube
- `GET /api/videos/:id` - Detalles de video específico

### **🎪 Conciertos**
- `GET /api/concerts/search` - Búsqueda de conciertos
- `GET /api/concerts/:id` - Detalles de concierto específico

### **👥 Comunidad**
- `GET /api/forum/posts` - Posts del foro
- `GET /api/playlists` - Playlists públicas
- `GET /api/favorites` - Favoritos del usuario

### **🎛️ Administrativo**
- `POST /api/admin/albums` - Crear álbum (admin)
- `PUT /api/admin/albums/:id` - Actualizar álbum (admin)
- `DELETE /api/admin/albums/:id` - Eliminar álbum (admin)

## 🧪 **Testing**

```bash
# Ejecutar todos los tests
cd backend && npm test

# Tests con reporte de cobertura
npm run test:coverage

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests para CI/CD
npm run test:ci
```

### **📊 Cobertura de Tests**
- **Modelos**: User, Album, Song, Playlist ✅
- **APIs**: Auth, Discography, Videos, Concerts ✅
- **Middlewares**: Auth, Cache, Pagination ✅
- **Servicios**: Notification, Cache, Logger ✅

## 🏗️ **Arquitectura**

```
twentyonepilots-app/
├── backend/                 # 🖥️ API Node.js/Express
│   ├── models/             # 📊 Modelos Mongoose
│   ├── routes/             # 🛣️ Endpoints API (25+ rutas)
│   ├── middleware/         # 🔧 Middlewares personalizados
│   ├── services/           # ⚙️ Servicios (email, cache, etc.)
│   ├── tests/              # 🧪 Tests automatizados
│   ├── config/             # ⚙️ Configuraciones
│   └── logs/               # 📝 Logs de aplicación
├── frontend/               # ⚛️ React App
│   ├── src/
│   │   ├── components/     # 🧩 Componentes React
│   │   ├── pages/          # 📄 Páginas
│   │   └── services/       # 🔗 Servicios frontend
│   └── public/             # 🖼️ Assets estáticos
└── .github/
    └── workflows/          # 🚀 CI/CD pipelines
```

## 🔒 **Seguridad**

- **🔐 Autenticación JWT** con refresh tokens
- **🛡️ Rate limiting** para prevenir abuso
- **🎭 Helmet** para headers de seguridad HTTP
- **✅ Validación de entrada** con Joi
- **🔒 Encriptación** de contraseñas con bcrypt
- **🌐 CORS** configurado correctamente
- **📊 Auditoría** de acciones de usuario
- **🔍 Sanitización** de inputs

## 📊 **Monitoreo y Logging**

- **🎯 PM2** para gestión de procesos en producción
- **📝 Winston** para logging estructurado con rotación
- **💚 Health checks** automáticos cada 30 segundos
- **📊 Métricas de rendimiento** en tiempo real
- **🚨 Alertas por Slack** para errores críticos
- **📈 Monitoreo de recursos** CPU, memoria, disco

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### **📋 Estándares de Código**
- ESLint configurado para JavaScript moderno
- Prettier para formateo automático
- Husky para pre-commit hooks
- Tests obligatorios para nuevas funcionalidades

## 📝 **Licencia**

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 **Agradecimientos**

- **Twenty One Pilots** por la inspiración musical
- **MongoDB Atlas** por la base de datos gratuita
- **YouTube API** por el contenido de videos
- **Eventbrite** por la integración de conciertos
- **La comunidad open source** por las herramientas utilizadas

## 📞 **Contacto**

- **👨‍💻 Autor**: [Tu Nombre]
- **📧 Email**: tu@email.com
- **🐙 GitHub**: [@tu-usuario](https://github.com/tu-usuario)
- **💼 LinkedIn**: [Tu Perfil](https://linkedin.com/in/tu-perfil)
- **🌐 Demo**: http://20.81.227.69/

---

⭐ **¡Si te gusta este proyecto, dale una estrella en GitHub!**

🎵 *"Sometimes quiet is violent"* - Twenty One Pilots 🎵