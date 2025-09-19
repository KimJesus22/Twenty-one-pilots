# Guía de Tests - Twenty One Pilots API

## 📋 Descripción
Suite completa de tests automatizados con Jest, Supertest y MongoDB Memory Server.

## 🚀 Ejecutar Tests

### Tests Básicos
```bash
npm test
```

### Tests con Watch Mode
```bash
npm run test:watch
```

### Tests con Cobertura
```bash
npm run test:coverage
```

### Tests para CI/CD
```bash
npm run test:ci
```

## 📊 Cobertura de Tests

### Modelos Testeados
- ✅ **User Model**
  - Creación de usuarios
  - Hash de contraseñas
  - Validación de contraseñas
  - Unicidad de username/email
  - Roles (user/admin)

- ✅ **Album Model**
  - Creación de álbumes
  - Validaciones requeridas
  - Relaciones con canciones

- ✅ **Song Model**
  - Creación de canciones
  - Población de datos de álbum
  - Validaciones

- ✅ **Playlist Model**
  - Creación de playlists
  - Relaciones con usuarios
  - Valores por defecto

### APIs Testeadas

#### Auth API (`/api/auth`)
- ✅ **POST /register**
  - Registro exitoso
  - Error por email duplicado
  - Error por username duplicado
  - Validación de campos requeridos
  - Validación de formato de email

- ✅ **POST /login**
  - Login exitoso
  - Error por email inválido
  - Error por contraseña inválida
  - Validación de campos requeridos

#### Discography API (`/api/discography`)
- ✅ **GET /albums**
  - Lista vacía cuando no hay álbumes
  - Paginación de resultados
  - Ordenamiento por año de lanzamiento

- ✅ **GET /albums/:id**
  - Obtener álbum por ID
  - Error 404 para álbum inexistente
  - Error 500 para ID inválido

- ✅ **GET /songs**
  - Lista de todas las canciones
  - Población de datos de álbum

- ✅ **GET /songs/:id**
  - Obtener canción por ID
  - Error 404 para canción inexistente

## 🛠️ Tecnologías Utilizadas

- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP
- **MongoDB Memory Server**: Base de datos en memoria para tests
- **Axios Mock**: Mock de llamadas HTTP externas

## 📁 Estructura de Tests

```
backend/tests/
├── setup.js              # Configuración global de tests
├── auth.test.js          # Tests de autenticación
├── discography.test.js   # Tests de discografía
├── models.test.js        # Tests de modelos
└── ...                   # Más tests según se expandan
```

## 🔧 Configuración

### Variables de Entorno para Tests
```env
NODE_ENV=test
JWT_SECRET=test_jwt_secret_key_for_testing_only
MONGO_URI=mongodb://localhost:27017/twentyonepilots_test
```

### Mocks Configurados
- **Notification Service**: Mocks para emails de bienvenida
- **Cache Service**: Mocks para Redis
- **Axios**: Mocks para APIs externas (YouTube, Eventbrite)

## 📈 Métricas de Calidad

### Umbrales de Cobertura
```json
{
  "branches": 70,
  "functions": 80,
  "lines": 80,
  "statements": 80
}
```

### Comandos para Verificar Cobertura
```bash
npm run test:coverage
# Resultado en: coverage/lcov-report/index.html
```

## 🎯 Mejores Prácticas Implementadas

- ✅ **Base de datos en memoria** para tests aislados
- ✅ **Limpieza automática** entre tests
- ✅ **Mocks inteligentes** para servicios externos
- ✅ **Setup/Teardown** apropiados
- ✅ **Tests descriptivos** con casos edge
- ✅ **Cobertura de código** monitoreada
- ✅ **CI/CD ready** con configuración específica

## 🚀 Próximos Tests a Implementar

- [ ] Tests de middleware de autenticación
- [ ] Tests de rutas de playlists
- [ ] Tests de APIs externas (YouTube, Eventbrite)
- [ ] Tests de servicios de notificaciones
- [ ] Tests de integración end-to-end
- [ ] Tests de carga y performance

## 📞 Ejecutar Tests Específicos

```bash
# Solo tests de auth
npm test auth.test.js

# Solo tests de modelos
npm test models.test.js

# Tests con patrón específico
npm test -- --testNamePattern="should register user"
```

## 🔍 Debugging de Tests

```bash
# Ver output detallado
npm test -- --verbose

# Ejecutar test específico en modo debug
npm test -- --inspect-brk auth.test.js
```

## 📊 Reportes de Cobertura

Los reportes de cobertura se generan en:
- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-final.json`
- **Consola**: Output directo en terminal

---

*Tests actualizados al: $(date)*