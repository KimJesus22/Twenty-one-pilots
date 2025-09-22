# 🚀 Guía Completa de Integración y Seguridad - Twenty One Pilots App

Esta guía documenta el proceso completo de integración del front-end con back-end, implementación de funcionalidades completas y medidas de seguridad avanzadas para la aplicación Twenty One Pilots.

## 📋 Tabla de Contenidos

1. [Integración Front-end con Endpoints](#1-integración-front-end-con-endpoints)
2. [Implementación del Back-end de Tienda](#2-implementación-del-back-end-de-tienda)
3. [Estado del Carrito con Context/Reducers](#3-estado-del-carrito-con-contextreducers)
4. [Autenticación de Usuarios](#4-autenticación-de-usuarios)
5. [Manejo de Errores y Optimización](#5-manejo-de-errores-y-optimización)
6. [Medidas de Seguridad Avanzadas](#6-medidas-de-seguridad-avanzadas)
7. [Configuración y Despliegue](#7-configuración-y-despliegue)
8. [Testing y Calidad de Código](#8-testing-y-calidad-de-código)

---

## 1. 🔗 Integración Front-end con Endpoints

### Gestión de Playlists

**Endpoints utilizados:**
- `GET /api/playlists/user/:userId` - Obtener playlists del usuario con paginación
- `GET /api/playlists/:id` - Obtener playlist específica
- `POST /api/playlists` - Crear nueva playlist
- `PUT /api/playlists/:id` - Actualizar playlist
- `DELETE /api/playlists/:id` - Eliminar playlist
- `POST /api/playlists/:id/songs` - Agregar canción
- `DELETE /api/playlists/:id/songs/:songId` - Eliminar canción

**Archivos implementados:**
- `frontend/src/api/playlists.js` - Cliente API para playlists
- `frontend/src/pages/Playlists.js` - Página actualizada con integración real
- `backend/routes/playlists.js` - Rutas del back-end (ya existían)

**Funcionalidades implementadas:**
- ✅ Creación, edición y eliminación de playlists
- ✅ Gestión de canciones en playlists
- ✅ Paginación completa
- ✅ Validación de permisos (solo propietario puede modificar)
- ✅ Manejo de errores y estados de carga

### Discografía

**Endpoints utilizados:**
- `GET /api/discography/albums` - Obtener álbumes con filtros y paginación
- `GET /api/discography/albums/:id` - Obtener álbum específico
- `GET /api/discography/songs` - Obtener canciones con filtros

**Archivos implementados:**
- `frontend/src/api/discography.js` - Cliente API para discografía
- `frontend/src/pages/Discography.js` - Página mejorada con navegación completa
- `backend/controllers/discographyController.js` - Controlador (ya existía)
- `backend/routes/discography.js` - Rutas (ya existían)

**Funcionalidades implementadas:**
- ✅ Visualización de álbumes con paginación
- ✅ Búsqueda y filtrado por título, año, artista
- ✅ Detalles completos de álbumes con canciones
- ✅ Navegación intuitiva entre álbumes
- ✅ Modal de detalles con lista de canciones reproducibles

### Tienda

**Endpoints implementados:**
- `GET /api/store/products` - Obtener productos con filtros
- `GET /api/store/products/:id` - Obtener producto específico
- `GET /api/store/categories` - Obtener categorías
- `POST /api/store/products` - Crear producto (admin)
- `PUT /api/store/products/:id` - Actualizar producto (admin)
- `DELETE /api/store/products/:id` - Eliminar producto (admin)
- `POST /api/store/checkout` - Procesar pago con Stripe

**Archivos implementados:**
- `frontend/src/api/store.js` - Cliente API para tienda
- `frontend/src/pages/Store.js` - Página completa de tienda
- `backend/controllers/storeController.js` - Controlador de tienda
- `backend/routes/store.js` - Rutas de tienda

---

## 2. 🏪 Implementación del Back-end de Tienda

### Modelo de Producto

```javascript
// backend/models/Product.js
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  category: {
    type: String,
    enum: ['clothing', 'accessories', 'music', 'posters', 'other'],
    required: true
  },
  stock: { type: Number, required: true, default: 0 },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
```

### Gestión de Inventario

- ✅ Control de stock en tiempo real
- ✅ Validación de disponibilidad antes de compra
- ✅ Actualización automática de stock tras pago exitoso
- ✅ Prevención de ventas con stock insuficiente

### Integración con Stripe

**Configuración requerida:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Funcionalidades:**
- ✅ Creación de sesiones de pago seguro
- ✅ Webhooks para confirmación de pagos
- ✅ Actualización automática de inventario
- ✅ Manejo de errores de pago

---

## 3. 🛒 Estado del Carrito con Context/Reducers

### Context de Carrito

**Archivo:** `frontend/src/contexts/CartContext.js`

**Características:**
- ✅ Estado global con useReducer
- ✅ Persistencia en localStorage cifrado
- ✅ Acciones: agregar, remover, actualizar cantidad, limpiar
- ✅ Cálculo automático de totales
- ✅ Validación de stock antes de checkout

### Hook Personalizado

```javascript
import { useCart } from '../contexts/CartContext';

function MiComponente() {
  const {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    validateStock
  } = useCart();

  // Uso del carrito...
}
```

### Integración con App

```javascript
// frontend/src/App.js
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <CartProvider>
      {/* Resto de la aplicación */}
    </CartProvider>
  );
}
```

---

## 4. 🔐 Autenticación de Usuarios

### Context de Autenticación

**Archivo:** `frontend/src/contexts/AuthContext.js`

**Funcionalidades:**
- ✅ Login/registro con validación
- ✅ Renovación automática de tokens
- ✅ Almacenamiento cifrado de datos sensibles
- ✅ Verificación de roles (admin/user)
- ✅ Logout seguro

### Middleware de Autenticación (Backend)

- ✅ Verificación de JWT tokens
- ✅ Middleware `authenticateToken`
- ✅ Middleware `requireAdmin`
- ✅ Protección de rutas sensibles

### Seguridad en Autenticación

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Refresh tokens para renovación automática
- ✅ Rate limiting en endpoints de auth

---

## 5. ⚡ Manejo de Errores y Optimización

### Manejo de Errores Global

**Backend:**
```javascript
// middleware de errores global
app.use((error, req, res, next) => {
  logger.error('Error no manejado', { error: error.message, stack: error.stack });
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno' : error.message
  });
});
```

**Frontend:**
- ✅ Error boundaries para capturar errores de React
- ✅ Manejo de errores en llamadas API
- ✅ Estados de carga y error en componentes
- ✅ Fallbacks para datos mock cuando APIs fallan

### Optimizaciones de Rendimiento

**Frontend:**
- ✅ Lazy loading de componentes
- ✅ Memoización con React.memo y useMemo
- ✅ Code splitting con React.lazy
- ✅ Optimización de imágenes y assets

**Backend:**
- ✅ Caché con Redis (opcional)
- ✅ Rate limiting inteligente
- ✅ Compresión de respuestas
- ✅ Pool de conexiones a BD

### Logging Avanzado

- ✅ Winston para logging estructurado
- ✅ Niveles: error, warn, info, debug
- ✅ Rotación automática de logs
- ✅ Logs separados por tipo (error, combined, etc.)

---

## 6. 🔒 Medidas de Seguridad Avanzadas

### Protección CSRF

**Middleware personalizado:** `backend/middleware/csrf.js`

- ✅ Tokens generados en servidor con crypto.randomBytes
- ✅ Validación en requests state-changing
- ✅ Expiración automática (1 hora)
- ✅ Envío en headers y cookies

### Validación y Sanitización

**Frontend (Yup):** `frontend/src/utils/validation.js`
```javascript
export const loginSchema = yup.object().shape({
  email: yup.string().required().email(),
  password: yup.string().required().min(8)
});
```

**Backend (express-validator):**
- ✅ Validación de tipos de datos
- ✅ Sanitización con express-sanitizer
- ✅ Validación de MongoDB ObjectIds

### Cifrado de Datos Sensibles

**Web Crypto API:** `frontend/src/utils/encryption.js`

- ✅ AES-GCM con PBKDF2 key derivation
- ✅ 100,000 iteraciones PBKDF2
- ✅ IV único por cifrado
- ✅ Almacenamiento seguro en localStorage

### HTTPS Obligatorio con HSTS

**Configuración SSL/TLS:**
- ✅ Certificados auto-firmados para desarrollo
- ✅ HSTS con max-age de 1 año
- ✅ Redirección automática HTTP → HTTPS
- ✅ Ciphersuites seguras (solo TLS 1.2+)

**Script de generación:** `scripts/generate-ssl-certs-node.js`

### Headers de Seguridad

```javascript
// Content Security Policy
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    // ... más directivas
  }
}

// HSTS
hsts: {
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}
```

---

## 7. ⚙️ Configuración y Despliegue

### Variables de Entorno

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/twentyonepilots

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SSL
FORCE_HTTPS=true
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt

# CSRF
CSRF_SECRET=your-csrf-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Comandos de Inicio

```bash
# Generar certificados SSL
node scripts/generate-ssl-certs-node.js

# Backend con HTTPS
cd backend && FORCE_HTTPS=true npm start

# Frontend
cd frontend && npm start

# Testing completo
npm run test:all
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "5000:5000"
    environment:
      - FORCE_HTTPS=true
      - NODE_ENV=production
    volumes:
      - ./ssl:/app/ssl:ro
```

---

## 8. 🧪 Testing y Calidad de Código

### Scripts de Testing

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    "security:audit": "npm audit && cd frontend && npm audit"
  }
}
```

### Pruebas Implementadas

**Unitarias:**
- ✅ `frontend/src/utils/__tests__/encryption.test.js` - Cifrado
- ✅ `backend/middleware/__tests__/csrf.test.js` - CSRF
- ✅ Pruebas de componentes React con RTL
- ✅ Pruebas de utilidades y helpers

**Integración:**
- ✅ Endpoints de API con Supertest
- ✅ Flujos completos de autenticación
- ✅ Integración con Stripe (mockeada)

### ESLint Configuration

**Frontend:** `frontend/.eslintrc.js`
- ✅ Reglas de React y hooks
- ✅ Reglas de accesibilidad
- ✅ Reglas de seguridad

**Backend:** `backend/.eslintrc.js`
- ✅ Reglas de Node.js
- ✅ Reglas de seguridad
- ✅ Reglas de estilo consistente

### Cobertura de Código

- ✅ Mínimo 80% de cobertura en statements
- ✅ Mínimo 75% de cobertura en branches
- ✅ Reportes HTML generados automáticamente

---

## 🎯 Checklist de Implementación Completa

### ✅ Integración Front-end
- [x] Playlists: CRUD completo con paginación
- [x] Discografía: Navegación y filtros avanzados
- [x] Tienda: Catálogo completo con carrito

### ✅ Back-end Completo
- [x] Tienda: Productos, inventario, pagos Stripe
- [x] Autenticación: JWT, bcrypt, refresh tokens
- [x] Validación: express-validator, sanitización
- [x] Seguridad: CSRF, rate limiting, headers seguros

### ✅ Estado Global
- [x] Context de carrito con reducers
- [x] Context de autenticación con cifrado
- [x] Persistencia segura en localStorage

### ✅ Seguridad Enterprise
- [x] HTTPS obligatorio con HSTS
- [x] Certificados SSL/TLS
- [x] Cifrado AES-GCM con PBKDF2
- [x] Protección CSRF completa
- [x] Validación y sanitización robusta

### ✅ Calidad y Testing
- [x] Pruebas unitarias completas
- [x] Pruebas de integración
- [x] Linting y cobertura de código
- [x] Documentación completa

---

## 🚀 Próximos Pasos

1. **Despliegue en producción** con certificados válidos
2. **Monitoreo y logging** avanzado
3. **Optimizaciones de performance** adicionales
4. **Auditoría de seguridad** externa
5. **Documentación de API** con Swagger

---

*Esta guía documenta la implementación completa desde la integración básica hasta las medidas de seguridad enterprise-grade. La aplicación está lista para producción con todas las mejores prácticas implementadas.*