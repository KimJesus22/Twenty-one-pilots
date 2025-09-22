# 🔒 Medidas de Seguridad Implementadas

Este documento describe las medidas de seguridad implementadas en la aplicación Twenty One Pilots para proteger contra ataques comunes web.

## 📋 Resumen de Medidas Implementadas

### 1. 🛡️ Protección CSRF (Cross-Site Request Forgery)
- **Middleware CSRF personalizado** (`backend/middleware/csrf.js`)
- **Tokens generados en servidor** con crypto.randomBytes (32 bytes)
- **Expiración automática** de tokens (1 hora)
- **Validación en requests POST/PUT/DELETE/PATCH**
- **Envío de tokens** en headers `X-CSRF-Token` y cookies `csrf-token`

### 2. ✅ Validación y Sanitización de Inputs
- **Frontend**: Esquemas Yup (`frontend/src/utils/validation.js`)
  - Validación de formularios de login, registro, playlists, productos
  - Sanitización de strings para prevenir XSS
  - Validación de emails, contraseñas, URLs
- **Backend**: express-validator mejorado
  - Validación de MongoDB ObjectIds
  - Sanitización de inputs con express-sanitizer
  - Validación de datos de productos, usuarios, playlists

### 3. 🔐 Cifrado de Datos Sensibles
- **Web Crypto API** (`frontend/src/utils/encryption.js`)
- **AES-GCM** con claves derivadas de PBKDF2
- **Parámetros criptográficos seguros**:
  - Iteraciones PBKDF2: 100,000
  - Longitud de clave: 256 bits
  - IV único por cifrado (12 bytes)
- **Almacenamiento en localStorage** cifrado para tokens y datos de usuario

### 4. 🔒 HTTPS Obligatorio con HSTS
- **Certificados SSL/TLS auto-firmados** generados con Node.js crypto
- **HSTS configurado** (maxAge: 31,536,000 segundos = 1 año)
- **Redirección HTTP a HTTPS** automática
- **Configuración de seguridad SSL**:
  - Solo TLS 1.2 y 1.3
  - Ciphersuites seguras
  - Certificate Transparency (en desarrollo)

### 5. 🧪 Pruebas de Seguridad
- **Pruebas unitarias** para cifrado (`frontend/src/utils/__tests__/encryption.test.js`)
- **Pruebas unitarias** para CSRF (`backend/middleware/__tests__/csrf.test.js`)
- **Cobertura de código** con Jest
- **Linting de seguridad** con ESLint

## 🚀 Cómo Usar las Medidas de Seguridad

### Configuración Inicial

1. **Generar certificados SSL**:
```bash
cd scripts
node generate-ssl-certs-node.js
```

2. **Instalar certificado CA** en tu sistema para desarrollo

3. **Configurar variables de entorno**:
```env
FORCE_HTTPS=true
NODE_ENV=production  # Para HSTS
```

### En el Frontend

```javascript
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, sanitizeString } from '../utils/validation';
import { encryptData, decryptData } from '../utils/encryption';

// Validación con Yup
const handleLogin = async (formData) => {
  try {
    const validatedData = await loginSchema.validate(formData);

    // Sanitizar inputs
    const sanitizedData = {
      email: sanitizeString(validatedData.email),
      password: validatedData.password
    };

    await login(sanitizedData);
  } catch (error) {
    console.error('Validation error:', error);
  }
};

// Cifrado de datos sensibles
const storeSensitiveData = async (data) => {
  const encrypted = await encryptData(data);
  localStorage.setItem('sensitive-data', encrypted);
};
```

### En el Backend

```javascript
const { csrfProtection, sendCSRFToken } = require('./middleware/csrf');

// Aplicar protección CSRF
app.use('/api/playlists', csrfProtection);
app.use('/api/store', csrfProtection);

// Enviar tokens CSRF
app.use(sendCSRFToken);

// Validación con express-validator
router.post('/products', [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('price').isFloat({ min: 0.01 }),
  // ... más validaciones
], createProduct);
```

## 🔧 Configuración de Seguridad

### Variables de Entorno

```env
# SSL/TLS
FORCE_HTTPS=true
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt
SSL_CA_BUNDLE_PATH=./ssl/ca-bundle.crt

# CSRF
CSRF_SECRET=your-super-secret-key-here

# JWT
JWT_SECRET=your-jwt-secret-here

# Base de datos
MONGO_URI=mongodb://localhost:27017/twentyonepilots
```

### Headers de Seguridad Configurados

- **Content Security Policy (CSP)**: Restringe fuentes de scripts, estilos, etc.
- **HSTS**: Fuerza HTTPS por 1 año
- **X-Frame-Options**: Previene clickjacking
- **X-Content-Type-Options**: Previene MIME sniffing
- **Referrer-Policy**: Controla envío de referrer
- **Permissions-Policy**: Restringe APIs del navegador

## 🧪 Ejecutar Pruebas de Seguridad

```bash
# Pruebas del frontend
cd frontend
npm run test:coverage

# Pruebas del backend
cd backend
npm run test:ci

# Linting
npm run lint
```

## ⚠️ Consideraciones de Producción

### Certificados SSL
- **NO usar certificados auto-firmados** en producción
- Obtener certificados de CAs reconocidas (Let's Encrypt, DigiCert, etc.)
- Configurar renovación automática

### Variables Secretas
- Nunca commitear secrets en código
- Usar gestores de secrets (AWS Secrets Manager, HashiCorp Vault)
- Rotar secrets regularmente

### Monitoreo
- Implementar logging de eventos de seguridad
- Configurar alertas para actividades sospechosas
- Monitorear intentos de ataques

### Actualizaciones
- Mantener dependencias actualizadas
- Aplicar parches de seguridad inmediatamente
- Revisar configuraciones de seguridad regularmente

## 📊 Métricas de Seguridad

La aplicación incluye endpoints para monitorear la seguridad:

- `GET /health` - Estado general con métricas de seguridad
- `POST /api/security/csp-report` - Reportes de violaciones CSP
- Headers de respuesta incluyen métricas de rate limiting

## 🔍 Auditoría de Seguridad

Para auditar la seguridad de la aplicación:

1. **Análisis estático**: ESLint con reglas de seguridad
2. **Pruebas dinámicas**: OWASP ZAP, Burp Suite
3. **Análisis de dependencias**: npm audit, Snyk
4. **Revisión de código**: Pair programming, code reviews

## 📞 Contacto

Para preguntas sobre seguridad o reportes de vulnerabilidades, contactar al equipo de desarrollo.