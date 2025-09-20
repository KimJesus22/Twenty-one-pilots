# 🤝 Guía de Contribución - Twenty One Pilots

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Estándares de Código](#-estándares-de-código)
- [Proceso de Desarrollo](#-proceso-de-desarrollo)
- [Testing](#-testing)
- [Pull Requests](#-pull-requests)
- [Gestión de Dependencias](#-gestión-de-dependencias)
- [Seguridad](#-seguridad)
- [Documentación](#-documentación)

## 🎯 Visión General

¡Bienvenido al proyecto Twenty One Pilots! Esta guía te ayudará a contribuir efectivamente al desarrollo de la aplicación. Valoramos las contribuciones de la comunidad y nos esforzamos por mantener un proceso colaborativo y de alta calidad.

### Tipos de Contribuciones

- 🐛 **Bug Fixes**: Corrección de errores
- ✨ **Features**: Nuevas funcionalidades
- 📚 **Documentation**: Mejoras en documentación
- 🧪 **Tests**: Pruebas unitarias e integración
- 🔒 **Security**: Mejoras de seguridad
- 🎨 **UI/UX**: Mejoras en interfaz de usuario
- ⚡ **Performance**: Optimizaciones de rendimiento

## 🛠️ Configuración del Entorno

### Prerrequisitos

#### Sistema Operativo
- **Windows**: 10/11 con WSL2 recomendado
- **macOS**: 12.0 o superior
- **Linux**: Ubuntu 20.04+, CentOS 8+, Fedora 33+

#### Software Requerido
```bash
# Node.js (versión LTS recomendada)
node --version  # Debe ser 18.x
npm --version   # Debe ser 8.x+

# Docker y Docker Compose
docker --version        # 20.10+
docker-compose --version # 2.0+

# Git
git --version # 2.30+

# Opcional pero recomendado
mongosh --version  # Para MongoDB local
redis-cli --version # Para Redis local
```

### Instalación Paso a Paso

#### 1. Clonar el Repositorio

```bash
# Clonar con submodules (si los hay)
git clone https://github.com/twentyonepilots/app.git
cd app

# Si hay submodules
git submodule update --init --recursive
```

#### 2. Configuración de Node.js

```bash
# Instalar dependencias del backend
cd backend
npm ci

# Instalar dependencias del frontend
cd ../frontend
npm ci

# Volver al directorio raíz
cd ..
```

#### 3. Configuración de Variables de Entorno

```bash
# Copiar archivos de ejemplo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar variables de entorno
# backend/.env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/twentyonepilots_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_here
YOUTUBE_API_KEY=your_youtube_api_key

# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api/v2
REACT_APP_ENVIRONMENT=development
```

#### 4. Configuración de Docker (Recomendado)

```bash
# Levantar todos los servicios
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps

# Ver logs
docker-compose logs -f
```

#### 5. Verificación de Instalación

```bash
# Backend
cd backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm start

# Verificar health check
curl http://localhost:5000/health
curl http://localhost:3000
```

### Configuración Avanzada

#### MongoDB Local (sin Docker)

```bash
# Instalar MongoDB
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Iniciar MongoDB
mongod --dbpath /path/to/your/db

# Crear base de datos de desarrollo
mongosh
use twentyonepilots_dev
```

#### Redis Local (sin Docker)

```bash
# Instalar Redis
# Windows: https://redis.io/download (usar WSL)
# macOS: brew install redis
# Linux: sudo apt-get install redis-server

# Iniciar Redis
redis-server

# Verificar conexión
redis-cli ping  # Debe responder PONG
```

## 📁 Estructura del Proyecto

```
twentyonepilots-app/
├── 📁 backend/                 # API Backend (Node.js)
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Controladores de API
│   │   ├── 📁 models/         # Modelos de datos (MongoDB)
│   │   ├── 📁 routes/         # Definición de rutas
│   │   ├── 📁 services/       # Lógica de negocio
│   │   ├── 📁 middleware/     # Middleware personalizado
│   │   └── 📁 utils/          # Utilidades
│   ├── 📁 tests/              # Pruebas backend
│   ├── 📁 docs/               # Documentación API
│   └── 📄 package.json
├── 📁 frontend/                # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/     # Componentes React
│   │   ├── 📁 pages/         # Páginas de la aplicación
│   │   ├── 📁 hooks/         # Custom hooks
│   │   ├── 📁 utils/         # Utilidades frontend
│   │   └── 📁 api/           # Cliente API
│   ├── 📁 public/            # Assets estáticos
│   └── 📄 package.json
├── 📁 docs/                   # Documentación general
├── 📁 scripts/                # Scripts de automatización
├── 📁 monitoring/             # Configuración de monitoreo
├── 📁 .github/                # GitHub Actions y configuración
├── 🐳 docker-compose.yml      # Orquestación de servicios
└── 📋 README.md
```

## 📏 Estándares de Código

### JavaScript/Node.js

#### ESLint Configuration

```javascript
// .eslintrc.js (backend)
module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:security/recommended'
  ],
  plugins: ['security', '@typescript-eslint'],
  rules: {
    // Estándares del proyecto
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-regexp': 'error'
  }
};
```

#### Estilos de Código

```javascript
// ✅ Correcto
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Error fetching user:', error);
    throw error;
  }
};

// ❌ Incorrecto
const getuserbyid = async (userid) => {
  const user = await User.findById(userid);
  if (!user) throw new Error('User not found');
  return user;
};
```

### React/JavaScript

#### Componentes

```jsx
// ✅ Componente funcional con hooks
const VideoCard = ({ video, onSelect }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSelect(video);
    } finally {
      setIsLoading(false);
    }
  }, [video, onSelect]);

  return (
    <div className="video-card" onClick={handleClick}>
      <img src={video.thumbnail} alt={video.title} />
      <h3>{video.title}</h3>
      {isLoading && <div className="loading-spinner" />}
    </div>
  );
};

// ❌ Antipatrón
const VideoCard = (props) => {
  return (
    <div onClick={() => props.onSelect(props.video)}>
      <img src={props.video.thumbnail} alt={props.video.title} />
      <h3>{props.video.title}</h3>
    </div>
  );
};
```

### Convenciones de Nombres

#### Archivos y Directorios
```
✅ userController.js     // camelCase para archivos
✅ UserService.js        // PascalCase para clases
✅ get-user-details.js   // kebab-case para utilidades
✅ video-player.css      // kebab-case para CSS
```

#### Variables y Funciones
```javascript
// ✅ Constantes
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'http://localhost:5000';

// ✅ Variables
let userData = null;
const isAuthenticated = false;

// ✅ Funciones
const getUserById = (id) => { /* ... */ };
const handleVideoSearch = async (query) => { /* ... */ };

// ✅ Clases
class VideoService {
  async searchVideos(query) { /* ... */ }
}
```

## 🔄 Proceso de Desarrollo

### Git Flow

```
main (producción)
├── develop (desarrollo)
│   ├── feature/NEW-FEATURE
│   ├── bugfix/BUG-FIX
│   ├── hotfix/CRITICAL-FIX
│   └── refactor/CODE-IMPROVEMENT
```

#### Ramas Principales

- **`main`**: Código de producción estable
- **`develop`**: Integración de nuevas funcionalidades

#### Ramas de Trabajo

```bash
# Crear rama para nueva funcionalidad
git checkout develop
git pull origin develop
git checkout -b feature/add-video-playlist

# Crear rama para corrección de bug
git checkout develop
git checkout -b bugfix/fix-video-loading

# Crear rama para hotfix (desde main)
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix
```

### Commits Convencionales

```bash
# Formato: type(scope): description
git commit -m "feat(video): add playlist functionality"
git commit -m "fix(auth): resolve JWT token expiration"
git commit -m "docs(api): update authentication examples"
git commit -m "refactor(components): optimize video player performance"
git commit -m "test(auth): add unit tests for login service"
```

#### Tipos de Commit

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Cambios de estilo (formato, etc.) |
| `refactor` | Refactorización de código |
| `test` | Agregar o corregir tests |
| `chore` | Cambios en herramientas, configuración |

## 🧪 Testing

### Estrategia de Testing

```
📊 Cobertura Objetivo: 80%+
├── 🧪 Unit Tests (70%)
├── 🔗 Integration Tests (20%)
└── 🎭 E2E Tests (10%)
```

### Ejecutar Tests

```bash
# Backend tests
cd backend
npm test                    # Ejecutar todos los tests
npm run test:watch         # Modo watch
npm run test:coverage      # Con reporte de cobertura

# Frontend tests
cd frontend
npm test                   # Ejecutar tests de React
npm run test:coverage     # Con cobertura

# Tests específicos
npm test -- --testNamePattern="should authenticate user"
npm test -- --testPathPattern="auth.test.js"
```

### Escribir Tests

#### Backend (Jest)

```javascript
// userController.test.js
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('User Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v2/auth/register', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/v2/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return error for duplicate email', async () => {
      // Crear usuario primero
      await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      const response = await request(app)
        .post('/api/v2/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Another User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Frontend (React Testing Library)

```jsx
// VideoCard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoCard from './VideoCard';

const mockVideo = {
  id: 'test-video-id',
  title: 'Test Video',
  thumbnail: 'test-thumbnail.jpg',
  channelTitle: 'Test Channel',
  description: 'Test description'
};

const mockOnSelect = jest.fn();

describe('VideoCard', () => {
  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders video information correctly', () => {
    render(<VideoCard video={mockVideo} onSelect={mockOnSelect} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Channel')).toBeInTheDocument();
    expect(screen.getByAltText('Test Video')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    render(<VideoCard video={mockVideo} onSelect={mockOnSelect} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockVideo);
    });
  });

  it('shows loading state during selection', async () => {
    mockOnSelect.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<VideoCard video={mockVideo} onSelect={mockOnSelect} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
  });
});
```

## 🔄 Pull Requests

### Plantilla de PR

```markdown
## 📝 Descripción
[Breve descripción de los cambios]

## 🎯 Tipo de Cambio
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📚 Documentation
- [ ] 🎨 UI/UX improvement
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security enhancement
- [ ] 🧪 Tests

## 🔍 Cambios Realizados
- Cambio 1: [descripción]
- Cambio 2: [descripción]
- Cambio 3: [descripción]

## 🧪 Testing
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Tests E2E pasan (si aplica)
- [ ] Linting pasa
- [ ] Security scan pasa

## 📋 Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He agregado tests para mis cambios
- [ ] He actualizado la documentación
- [ ] He probado los cambios localmente
- [ ] Los commits siguen el formato convencional

## 🔗 Issues Relacionados
- Closes #123
- Relates to #456

## 📸 Screenshots (si aplica)
[Agregar screenshots de cambios visuales]

## 🚀 Notas de Despliegue
[Instrucciones especiales para despliegue]
```

### Proceso de Revisión

#### Checklist del Revisor

```markdown
## ✅ Checklist de Revisión

### Código
- [ ] El código es legible y bien estructurado
- [ ] Sigue las convenciones de nomenclatura
- [ ] No hay código duplicado
- [ ] Las funciones son pequeñas y enfocadas
- [ ] Manejo adecuado de errores

### Tests
- [ ] Tests cubren los casos principales
- [ ] Tests cubren casos edge
- [ ] Cobertura de código adecuada
- [ ] Tests pasan en CI/CD

### Seguridad
- [ ] No hay vulnerabilidades conocidas
- [ ] Validación adecuada de inputs
- [ ] Manejo seguro de datos sensibles
- [ ] Headers de seguridad apropiados

### Performance
- [ ] No hay regresiones de performance
- [ ] Consultas a BD optimizadas
- [ ] Uso eficiente de memoria
- [ ] Carga de página aceptable

### Documentación
- [ ] README actualizado si es necesario
- [ ] Comentarios en código complejo
- [ ] Documentación de API actualizada
- [ ] Cambios breaking documentados
```

### Aprobación de PR

#### Requisitos para Aprobación

1. **✅ Tests pasan**: Todos los tests deben pasar en CI/CD
2. **✅ Code review**: Al menos 1 aprobación de maintainer
3. **✅ Security check**: No vulnerabilidades críticas
4. **✅ Documentation**: Documentación actualizada si es necesario
5. **✅ Breaking changes**: Documentados y justificados

#### Merge Strategy

```bash
# Squash and merge para features pequeñas
# Merge commit para features grandes con múltiples commits
# Rebase and merge para hotfixes
```

## 📦 Gestión de Dependencias

### Actualización de Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias específicas
npm update package-name

# Actualizar todas las dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Corregir vulnerabilidades automáticamente
npm audit fix
```

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "daily"
    groups:
      security-updates:
        applies-to: security-updates
```

## 🔒 Seguridad

### Mejores Prácticas

#### Autenticación y Autorización
```javascript
// ✅ Validar JWT correctamente
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};
```

#### Validación de Input
```javascript
// ✅ Usar validadores robustos
const validateUserInput = (req, res, next) => {
  const { email, password } = req.body;

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Validar password
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password debe tener al menos 8 caracteres' });
  }

  next();
};
```

#### Manejo de Errores Seguro
```javascript
// ✅ No exponer información sensible en errores
app.use((error, req, res, next) => {
  logger.error('Error:', error);

  // No enviar stack trace en producción
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    success: false,
    message: isDevelopment ? error.message : 'Error interno del servidor',
    ...(isDevelopment && { stack: error.stack })
  });
});
```

### Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** crear un issue público
2. Enviar email a: security@twentyonepilots.com
3. Incluir detalles de la vulnerabilidad
4. Esperar confirmación antes de hacer público

## 📚 Documentación

### Actualizar Documentación

```bash
# Generar documentación de API automáticamente
cd backend
npm run docs:generate

# Construir sitio de documentación
cd docs
npm run build

# Desplegar documentación
npm run deploy
```

### Estructura de Documentación

```
docs/
├── 📄 API_DOCUMENTATION.md    # Documentación de API
├── 📄 ARCHITECTURE.md         # Arquitectura del sistema
├── 📄 API_EXAMPLES.md         # Ejemplos de uso
├── 📄 CONTRIBUTING.md         # Esta guía
├── 📄 DEPENDENCY_MANAGEMENT.md # Gestión de dependencias
└── 📄 INSTALLATION.md         # Guía de instalación
```

### Documentación de Código

```javascript
/**
 * Busca videos en YouTube y los almacena en cache
 * @param {string} query - Término de búsqueda
 * @param {Object} options - Opciones de búsqueda
 * @param {number} options.limit - Número máximo de resultados
 * @param {string} options.order - Orden de resultados
 * @returns {Promise<Array>} Lista de videos encontrados
 * @throws {Error} Si la búsqueda falla
 *
 * @example
 * const videos = await searchVideos('Twenty One Pilots', { limit: 10 });
 * console.log(videos[0].title); // "Stressed Out"
 */
async function searchVideos(query, options = {}) {
  // Implementation...
}
```

## 🎯 Métricas de Contribución

### Calidad de Código
- **Cobertura de Tests**: > 80%
- **Complejidad Ciclomática**: < 10
- **Duplicación de Código**: < 5%
- **Tiempo de Build**: < 5 minutos

### Performance
- **Response Time**: < 500ms para API calls
- **Bundle Size**: < 2MB para frontend
- **Memory Usage**: < 512MB por instancia
- **CPU Usage**: < 70% promedio

### Disponibilidad
- **Uptime**: > 99.5%
- **Error Rate**: < 1%
- **MTTR**: < 30 minutos
- **MTTD**: < 5 minutos

## 📞 Soporte

### Canales de Comunicación

- **💬 Discord**: [Twenty One Pilots Dev Community](https://discord.gg/twentyonepilots)
- **📧 Email**: dev@twentyonepilots.com
- **🐛 Issues**: [GitHub Issues](https://github.com/twentyonepilots/app/issues)
- **📖 Wiki**: [Project Wiki](https://github.com/twentyonepilots/app/wiki)

### Tipos de Soporte

| Tipo | Canal | Respuesta Esperada |
|------|-------|-------------------|
| 🐛 Bug Report | GitHub Issue | 24 horas |
| ❓ Pregunta General | Discord | 4 horas |
| 🚨 Security Issue | Email | 1 hora |
| 💡 Feature Request | GitHub Discussion | 48 horas |

## 🙏 Reconocimientos

¡Gracias por contribuir al proyecto Twenty One Pilots! Tu trabajo ayuda a mejorar la experiencia de miles de fans de la banda.

### Contribuidores Destacados

- ⭐ **Top Contributors**: Lista de contribuidores activos
- 🏆 **Hall of Fame**: Reconocimientos especiales
- 📊 **Contribution Stats**: Estadísticas de contribución

---

**Última actualización**: $(date)
**Versión de la guía**: 2.0.0
**Mantenedor**: DevOps Team