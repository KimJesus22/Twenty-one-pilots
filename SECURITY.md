# 🔒 Guía de Seguridad - Twenty One Pilots

Esta guía documenta las políticas, procedimientos y mejores prácticas de seguridad implementadas en la aplicación Twenty One Pilots, incluyendo autenticación multifactor (MFA/2FA), control de acceso basado en roles (RBAC), auditoría de seguridad y cumplimiento normativo.

## 📋 Tabla de Contenidos

- [Visión General de Seguridad](#-visión-general-de-seguridad)
- [Autenticación y Autorización](#-autenticación-y-autorización)
- [Control de Acceso Basado en Roles (RBAC)](#-control-de-acceso-basado-en-roles-rbac)
- [Autenticación Multifactor (MFA/2FA)](#-autenticación-multifactor-mfa2fa)
- [Auditoría y Monitoreo](#-auditoría-y-monitoreo)
- [Gestión de Usuarios](#-gestión-de-usuarios)
- [Seguridad en Despliegues](#-seguridad-en-despliegues)
- [Cumplimiento y Regulaciones](#-cumplimiento-y-regulaciones)
- [Respuesta a Incidentes](#-respuesta-a-incidentes)
- [Mejores Prácticas](#-mejores-prácticas)

## 🛡️ Visión General de Seguridad

### Arquitectura de Seguridad

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   End Users     │───▶│  Authentication  │───▶│ Authorization   │
│   (MFA Required)│    │  (JWT + 2FA)    │    │  (RBAC)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Rate Limiting  │───▶│ Audit Logging   │
│   (Nginx)       │    │  & DDoS Prot.   │    │  & Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Principios de Seguridad

1. **Defensa en Profundidad**: Múltiples capas de controles de seguridad
2. **Principio de Menor Privilegio**: Usuarios tienen solo los permisos necesarios
3. **Autenticación Fuerte**: MFA obligatorio para todas las cuentas
4. **Auditoría Completa**: Registro de todas las actividades sensibles
5. **Cero Confianza**: Verificación continua de confianza

## 🤖 Protección contra Bots - reCAPTCHA v3

### Implementación de reCAPTCHA

#### **Arquitectura de Protección**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  reCAPTCHA v3   │───▶│  Backend        │
│   (Token Gen)   │    │  (Score 0-1)   │    │  (Validation)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Risk Analysis │───▶│  Action-based   │───▶│  Audit Logging  │
│   (Score Eval)  │    │  Verification   │    │  (Monitoring)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Configuración de reCAPTCHA**
```javascript
// Variables de entorno requeridas
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_MINIMUM_SCORE=0.5  // Umbral de aceptación
```

#### **Acciones Soportadas**
- **login**: Verificación de login
- **register**: Verificación de registro
- **create_thread**: Creación de hilos en foro
- **submit**: Acciones generales

### Servicio reCAPTCHA Backend

#### **Validación del Token**
```javascript
const recaptchaService = require('./services/recaptchaService');

// Verificar token para login
const result = await recaptchaService.verifyToken(
  token,
  'login',
  ipAddress,
  userAgent
);

if (!result.success) {
  throw new Error(result.error);
}
```

#### **Evaluación de Riesgo**
```javascript
// Niveles de riesgo basados en score
const riskLevels = {
  very_low: score >= 0.9,    // Confianza alta
  low: score >= 0.7,         // Confianza media
  medium: score >= 0.5,      // Confianza baja
  high: score >= 0.3,        // Sospechoso
  very_high: score < 0.3     // Muy sospechoso
};
```

### Integración Frontend

#### **Hook useRecaptcha**
```javascript
import useRecaptcha from '../hooks/useRecaptcha';

const { isEnabled, siteKey, executeRecaptcha } = useRecaptcha();

// Ejecutar verificación
const result = await executeRecaptcha('login');
if (result.success) {
  // Enviar token al backend
  submitForm({ ...data, recaptchaToken: result.token });
}
```

#### **Componente ReCaptcha**
```javascript
import ReCaptcha from '../components/ReCaptcha';

<ReCaptcha
  siteKey={siteKey}
  onVerify={(token) => setRecaptchaToken(token)}
  onExpired={() => setRecaptchaToken(null)}
  action="login"
  size="normal"
  theme="light"
/>
```

### Políticas de reCAPTCHA

#### **Umbrales de Aceptación**
- **Score ≥ 0.9**: Aceptación automática (muy confiable)
- **Score ≥ 0.5**: Aceptación condicional
- **Score < 0.5**: Rechazo automático
- **Score < 0.3**: Bloqueo temporal de IP

#### **Acciones por Riesgo**
```javascript
const riskActions = {
  very_low: 'accept',           // Aceptar
  low: 'accept',                // Aceptar
  medium: 'challenge',          // Desafío adicional
  high: 'reject',               // Rechazar
  very_high: 'block'            // Bloquear IP
};
```

### Monitoreo y Alertas

#### **Métricas de reCAPTCHA**
```javascript
// Métricas disponibles en Grafana
recaptcha_verifications_total{success="true|false"}
recaptcha_risk_total{level="very_low|low|medium|high|very_high"}
recaptcha_score{action="login|register|create_thread"}
recaptcha_failures_total{reason="low_score|invalid_token|expired"}
```

#### **Alertas Configuradas**
- **Alta tasa de fallos**: > 20% de verificaciones fallidas en 5 minutos
- **Score promedio bajo**: < 0.6 promedio en 10 minutos
- **Actividad sospechosa**: > 10 verificaciones de alto riesgo por hora

### Endpoints Protegidos

#### **Rutas con reCAPTCHA**
```javascript
// Autenticación
POST /api/auth/login          // reCAPTCHA requerido
POST /api/auth/register       // reCAPTCHA requerido

// Foro (futuro)
POST /api/forum/threads       // reCAPTCHA requerido
POST /api/forum/posts         // reCAPTCHA opcional
```

#### **Configuración de Endpoint**
```javascript
// Obtener configuración de reCAPTCHA
GET /api/auth/recaptcha/config

Response: {
  "success": true,
  "data": {
    "siteKey": "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
    "enabled": true,
    "minimumScore": 0.5
  }
}
```

### Manejo de Errores

#### **Tipos de Error**
- **Token faltante**: `recaptcha_token_required`
- **Token inválido**: `recaptcha_token_invalid`
- **Score insuficiente**: `recaptcha_score_too_low`
- **Acción no coincide**: `recaptcha_action_mismatch`
- **Verificación fallida**: `recaptcha_verification_failed`

#### **Respuestas de Error**
```json
{
  "success": false,
  "message": "Validación reCAPTCHA fallida: puntuación insuficiente",
  "error": "recaptcha_score_too_low",
  "details": {
    "score": 0.3,
    "minimumScore": 0.5,
    "action": "login"
  }
}
```

### Mejores Prácticas

#### **Implementación Segura**
1. **Validación del lado del servidor**: Nunca confiar solo en frontend
2. **Timeouts apropiados**: Configurar timeouts de verificación
3. **Logging completo**: Registrar todas las verificaciones
4. **Monitoreo continuo**: Alertas en tiempo real
5. **Actualización regular**: Mantener scores y umbrales actualizados

#### **UX Considerations**
- **Carga diferida**: Solo mostrar reCAPTCHA cuando sea necesario
- **Feedback visual**: Indicadores claros de estado de verificación
- **Reintentos**: Permitir reintentos en caso de fallos temporales
- **Accesibilidad**: Soporte completo para lectores de pantalla

#### **Optimización de Performance**
- **Cache de configuración**: Cache de configuración de reCAPTCHA
- **Validación asíncrona**: No bloquear UI durante verificación
- **Retry logic**: Reintentos automáticos para fallos temporales
- **Rate limiting**: Protección adicional contra abuso

### Troubleshooting

#### **Problemas Comunes**
- **Script no carga**: Verificar conexión a Google
- **Token expirado**: Implementar renovación automática
- **Score inconsistente**: Revisar configuración de umbrales
- **Falsos positivos**: Ajustar umbrales por acción

#### **Debugging**
```javascript
// Verificar configuración
console.log('reCAPTCHA Config:', {
  enabled: recaptchaEnabled,
  siteKey: siteKey?.substring(0, 10) + '...',
  loaded: !!window.grecaptcha
});

// Verificar token
console.log('reCAPTCHA Token:', {
  exists: !!recaptchaToken,
  length: recaptchaToken?.length,
  valid: validateToken(recaptchaToken)
});
```

---

## 🔐 Autenticación y Autorización

### Sistema de Autenticación

#### **Flujo de Login Seguro**
1. **Credenciales Iniciales**: Email + contraseña
2. **Verificación de Cuenta**: Estado de bloqueo por intentos fallidos
3. **MFA Obligatorio**: Verificación TOTP o códigos de respaldo
4. **Token JWT**: Acceso autorizado con expiración
5. **Renovación**: Refresh tokens para sesiones extendidas

#### **Protecciones Anti-Brute Force**
- **Límite de Intentos**: Máximo 5 intentos fallidos por hora
- **Bloqueo Temporal**: 2 horas de bloqueo tras múltiples fallos
- **Bloqueo Permanente**: Revisión manual para casos extremos
- **Notificación**: Alertas a administradores de actividad sospechosa

### Gestión de Sesiones

#### **Configuración de Tokens**
```javascript
// JWT Configuration
expiresIn: '7d'          // 7 días para tokens regulares
refreshExpiresIn: '30d'  // 30 días para refresh tokens
tempTokenExpiresIn: '5m' // 5 minutos para tokens temporales 2FA
```

#### **Invalidación de Sesiones**
- **Logout Explícito**: Invalidación inmediata
- **Expiración Automática**: Basada en tiempo configurado
- **Invalidación Forzada**: Por administradores en caso de compromiso
- **Detección de Sesiones Activas**: Monitoreo de uso concurrente

## 👥 Control de Acceso Basado en Roles (RBAC)

### Jerarquía de Roles

#### **Roles del Sistema**
1. **Usuario** (`user`)
   - Acceso básico a la aplicación
   - Gestión de perfil personal
   - Reproducción de contenido

2. **Moderador** (`moderator`)
   - Todos los permisos de usuario
   - Moderación de contenido
   - Gestión de comentarios
   - Reportes de usuarios

3. **Desplegador** (`deployer`)
   - Permisos de despliegue staging
   - Acceso a pipelines CI/CD
   - Monitoreo de infraestructura

4. **Administrador** (`admin`)
   - **Todos los permisos del sistema**
   - Gestión completa de usuarios
   - Configuración del sistema
   - Acceso a auditorías

### Permisos Granulares

#### **Recursos del Sistema**
```javascript
PERMISSIONS = {
  // Gestión de usuarios
  USER_MANAGE: { resource: 'users', action: 'admin' },
  USER_READ: { resource: 'users', action: 'read' },
  USER_UPDATE: { resource: 'users', action: 'update' },
  USER_DELETE: { resource: 'users', action: 'delete' },

  // Gestión de contenido
  CONTENT_MANAGE: { resource: 'content', action: 'admin' },
  CONTENT_CREATE: { resource: 'content', action: 'create' },
  CONTENT_READ: { resource: 'content', action: 'read' },
  CONTENT_UPDATE: { resource: 'content', action: 'update' },
  CONTENT_DELETE: { resource: 'content', action: 'delete' },

  // Sistema y despliegues
  SYSTEM_ADMIN: { resource: 'system', action: 'admin' },
  DEPLOY_STAGING: { resource: 'deployment', action: 'staging' },
  DEPLOY_PRODUCTION: { resource: 'deployment', action: 'production' },

  // Auditoría
  AUDIT_READ: { resource: 'audit', action: 'read' },
  AUDIT_ADMIN: { resource: 'audit', action: 'admin' }
}
```

### Gestión de Permisos

#### **Asignación de Permisos**
```bash
# Asignar permisos vía API
curl -X POST /api/admin/users/{userId}/permissions \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"resource": "deployment", "action": "production"}'
```

#### **Revocación de Permisos**
```bash
# Revocar permisos vía API
curl -X DELETE /api/admin/users/{userId}/permissions \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"resource": "deployment", "action": "production"}'
```

## 🔢 Autenticación Multifactor (MFA/2FA)

### Implementación TOTP

#### **Configuración de 2FA**
1. **Generación de Secret**: Algoritmo TOTP estándar
2. **Código QR**: Formato otpauth:// para apps autenticadoras
3. **Verificación Inicial**: Validación del primer código
4. **Códigos de Respaldo**: 10 códigos one-time-use

#### **Apps Soportadas**
- **Google Authenticator**
- **Microsoft Authenticator**
- **Authy**
- **1Password**
- **LastPass Authenticator**

### Flujo de Verificación 2FA

#### **Login con 2FA**
```javascript
// 1. Credenciales válidas
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
// Response: { requiresTwoFactor: true, tempToken: "..." }

// 2. Verificación 2FA
POST /api/auth/2fa/verify
{
  "tempToken": "...",
  "twoFactorToken": "123456"
}
// Response: { token: "jwt_token", user: {...} }
```

#### **Códigos de Respaldo**
- **Generación**: 10 códigos alfanuméricos únicos
- **Uso**: Un solo uso por código
- **Regeneración**: Opción para generar nuevos códigos
- **Almacenamiento**: Encriptado en base de datos

### Políticas de 2FA

#### **Obligatoriedad**
- **Cuentas Nuevas**: 2FA requerido durante registro
- **Cuentas Existentes**: Migración gradual con recordatorios
- **Cuentas Admin**: 2FA obligatorio sin excepciones
- **Cuentas Service**: Tokens dedicados para APIs

#### **Recuperación de Acceso**
1. **Verificación de Identidad**: Email + información personal
2. **Códigos de Respaldo**: Si disponibles
3. **Reset Administrativo**: Solo por administradores
4. **Re-configuración**: Nuevo setup de 2FA

## 📊 Auditoría y Monitoreo

### Sistema de Auditoría

#### **Eventos Auditados**
```javascript
AUDIT_EVENTS = {
  // Autenticación
  'LOGIN_SUCCESS': 'Inicio de sesión exitoso',
  'LOGIN_FAILURE': 'Fallo de autenticación',
  'LOGOUT': 'Cierre de sesión',

  // 2FA
  '2FA_ENABLED': '2FA habilitado',
  '2FA_DISABLED': '2FA deshabilitado',
  '2FA_VERIFICATION_SUCCESS': 'Verificación 2FA exitosa',
  '2FA_VERIFICATION_FAILURE': 'Verificación 2FA fallida',
  'BACKUP_CODE_USED': 'Código de respaldo utilizado',

  // Autorización
  'PERMISSION_GRANTED': 'Permiso otorgado',
  'PERMISSION_REVOKED': 'Permiso revocado',
  'UNAUTHORIZED_ACCESS': 'Acceso no autorizado',

  // Administración
  'ROLE_CHANGED': 'Rol de usuario cambiado',
  'USER_CREATED': 'Usuario creado',
  'USER_DELETED': 'Usuario eliminado',

  // Seguridad
  'SECURITY_ALERT': 'Alerta de seguridad',
  'SUSPICIOUS_ACTIVITY': 'Actividad sospechosa',
  'ACCOUNT_LOCKED': 'Cuenta bloqueada',
  'ACCOUNT_UNLOCKED': 'Cuenta desbloqueada',

  // Despliegues
  'DEPLOYMENT_START': 'Inicio de despliegue',
  'DEPLOYMENT_SUCCESS': 'Despliegue exitoso',
  'DEPLOYMENT_FAILURE': 'Despliegue fallido'
}
```

#### **Campos de Auditoría**
- **Timestamp**: Fecha y hora del evento
- **Usuario**: ID del usuario que realizó la acción
- **IP Address**: Dirección IP del cliente
- **User Agent**: Información del navegador/dispositivo
- **Acción**: Tipo de evento auditado
- **Detalles**: Información adicional del evento
- **Severidad**: Nivel de criticidad (info, warning, error, critical)

### Monitoreo de Seguridad

#### **Métricas de Seguridad**
```javascript
SECURITY_METRICS = {
  totalUsers: 1250,
  lockedUsers: 5,
  twoFactorUsers: 1100,
  twoFactorPercentage: 88,
  recentFailedLogins: 23,
  recentSuccessfulLogins: 1250,
  securityScore: 92
}
```

#### **Dashboards de Monitoreo**
- **Autenticación**: Tendencias de login y fallos
- **2FA**: Tasas de verificación y uso de respaldos
- **RBAC**: Cambios de permisos y roles
- **Administración**: Acciones de administradores
- **Despliegues**: Autorizaciones y resultados
- **Amenazas**: IPs bloqueadas y alertas

## 👤 Gestión de Usuarios

### Ciclo de Vida de Usuarios

#### **Registro Seguro**
1. **Validación de Email**: Verificación de formato y unicidad
2. **Contraseña Fuerte**: Requisitos de complejidad
3. **Verificación de Email**: Token de confirmación
4. **2FA Obligatorio**: Configuración durante registro

#### **Estados de Usuario**
- **Pendiente**: Email no verificado
- **Activo**: Usuario completamente configurado
- **Bloqueado**: Por intentos fallidos o acción administrativa
- **Suspendido**: Acceso temporalmente revocado
- **Eliminado**: Cuenta permanentemente eliminada

### Gestión de Contraseñas

#### **Políticas de Contraseña**
```javascript
PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  preventReuse: true,
  maxAge: 90 // días
}
```

#### **Reset de Contraseña**
1. **Solicitud**: Token enviado por email
2. **Verificación**: Token válido por 1 hora
3. **Nueva Contraseña**: Sujeta a políticas
4. **2FA**: Verificación adicional si configurada

## 🚀 Seguridad en Despliegues

### Autenticación en Pipelines

#### **Validación MFA en CI/CD**
```yaml
# GitHub Actions - MFA Validation
- name: Validate MFA for Production Deployment
  env:
    DEPLOYMENT_USER: ${{ github.actor }}
    DEPLOYMENT_TOKEN: ${{ secrets.DEPLOYMENT_JWT_TOKEN }}
    MFA_TOKEN: ${{ secrets.DEPLOYMENT_MFA_TOKEN }}
    API_BASE_URL: ${{ secrets.PRODUCTION_API_URL }}
    DEPLOYMENT_TYPE: production
    REQUIRED_ROLE: deployer
  run: ./scripts/deployment/validate-mfa.sh
```

#### **Roles de Despliegue**
- **Staging**: Rol `deployer` con permisos staging
- **Producción**: Rol `deployer` con permisos production
- **Rollback**: Rol `admin` para reversiones de emergencia

### Seguridad en Scripts

#### **RBAC en Scripts de Deployment**
```bash
# Validar permisos antes de deployment
./scripts/deployment/setup-deployment-rbac.sh setup \
  deployer-ci ci@domain.com securepass123 production
```

#### **Auditoría de Despliegues**
- **Inicio**: Registro de usuario y timestamp
- **Autorización**: Verificación MFA y RBAC
- **Ejecución**: Logging de comandos ejecutados
- **Resultado**: Éxito/fallo con métricas
- **Rollback**: Automático en caso de fallos

## 📋 Cumplimiento y Regulaciones

### Estándares de Seguridad

#### **ISO 27001**
- **Control de Acceso**: RBAC implementado
- **Autenticación**: MFA obligatorio
- **Auditoría**: Logging completo
- **Gestión de Activos**: Inventario de sistemas

#### **GDPR (RGPD)**
- **Consentimiento**: Políticas de privacidad claras
- **Derechos del Usuario**: Acceso, rectificación, eliminación
- **Protección de Datos**: Encriptación en tránsito y reposo
- **Notificación de Brechas**: Procedimientos documentados

#### **SOX Compliance**
- **Controles Internos**: Auditoría de cambios
- **Separación de Funciones**: RBAC evita conflictos
- **Registros Financieros**: No aplicable directamente

### Certificaciones y Auditorías

#### **Programa de Certificación**
- **Auditorías Internas**: Trimestrales
- **Auditorías Externas**: Anuales
- **Penetration Testing**: Semestral
- **Code Reviews**: Para cambios críticos

#### **Reportes de Cumplimiento**
- **Security Score**: Métrica automatizada (0-100)
- **Coverage Reports**: Porcentaje de código auditado
- **Incident Reports**: Análisis de incidentes de seguridad
- **Compliance Dashboard**: Estado general del cumplimiento

## 🚨 Respuesta a Incidentes

### Clasificación de Incidentes

#### **Niveles de Severidad**
- **Crítico**: Compromiso de datos, acceso no autorizado a producción
- **Alto**: Fallos de autenticación masivos, DDoS exitoso
- **Medio**: Intentos de intrusión detectados, vulnerabilidades
- **Bajo**: Escaneos de puertos, intentos fallidos

#### **Tiempos de Respuesta**
- **Crítico**: 15 minutos
- **Alto**: 1 hora
- **Medio**: 4 horas
- **Bajo**: 24 horas

### Equipos de Respuesta

#### **Security Incident Response Team (SIRT)**
- **Líder**: Chief Information Security Officer
- **Técnicos**: Security Engineers
- **Comunicación**: Public Relations
- **Legal**: Compliance Officer

#### **Procedimientos de Respuesta**
1. **Detección**: Monitoreo automático y reportes
2. **Evaluación**: Análisis de impacto y severidad
3. **Contención**: Aislamiento del incidente
4. **Erradicación**: Eliminación de la causa raíz
5. **Recuperación**: Restauración de servicios
6. **Lecciones Aprendidas**: Post-mortem y mejoras

### Comunicación de Incidentes

#### **Plantilla de Notificación**
```markdown
# Security Incident Report

## Incident Details
- **ID**: INC-2025-001
- **Date/Time**: 2025-01-15 14:30 UTC
- **Severity**: High
- **Status**: Resolved

## Description
[Brief description of the incident]

## Impact Assessment
- **Users Affected**: X users
- **Data Compromised**: [Description]
- **Service Disruption**: [Duration]

## Root Cause
[Technical analysis]

## Resolution
[Actions taken to resolve]

## Prevention Measures
[Steps to prevent recurrence]
```

## 💡 Mejores Prácticas

### Desarrollo Seguro

#### **Secure Coding Guidelines**
- **Input Validation**: Sanitización de todas las entradas
- **Output Encoding**: Prevención de XSS
- **SQL Injection**: Uso de ORMs preparados
- **CSRF Protection**: Tokens en formularios sensibles

#### **Code Reviews**
- **Security Checklist**: Requisitos mínimos de seguridad
- **Automated Scanning**: SAST y DAST en pipelines
- **Peer Review**: Al menos 2 revisores para código crítico
- **Dependency Scanning**: Verificación de vulnerabilidades

### Configuración de Infraestructura

#### **Hardening de Servidores**
```bash
# SSH Configuration
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3

# Firewall Rules
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
```

#### **Configuración SSL/TLS**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:...;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Monitoreo Continuo

#### **Alertas de Seguridad**
- **Failed Logins**: > 5 por IP por hora
- **Unusual Traffic**: Picos de requests
- **Configuration Changes**: Cambios en archivos críticos
- **Privilege Escalation**: Intentos de acceso no autorizado

#### **Health Checks**
```bash
# Application Health
curl -f https://api.domain.com/health

# Security Headers
curl -I https://app.domain.com | grep -E "(X-Frame-Options|X-Content-Type-Options)"

# Certificate Expiry
openssl s_client -connect domain.com:443 -servername domain.com 2>/dev/null | openssl x509 -noout -dates
```

### Capacitación y Conciencia

#### **Programa de Seguridad**
- **Capacitación Inicial**: Para nuevos empleados
- **Refuerzo Anual**: Actualización de políticas
- **Simulacros**: Ejercicios de respuesta a incidentes
- **Gamificación**: Programas de bug bounty

#### **Políticas de Usuario**
- **Uso Aceptable**: Reglas claras de uso
- **Reportes de Incidentes**: Procedimientos para reportar
- **Acceso Remoto**: VPN obligatorio para administradores
- **Dispositivos**: Gestión de dispositivos corporativos

---

## 📞 Contactos de Seguridad

### Equipo de Seguridad
- **CISO**: security@ciso@twentyonepilots.com
- **Security Operations**: soc@twentyonepilots.com
- **Compliance**: compliance@twentyonepilots.com

### Reportes de Vulnerabilidades
- **Email**: security@twentyonepilots.com
- **Bug Bounty**: https://bugbounty.twentyonepilots.com
- **PGP Key**: Disponible en el sitio web

### Emergencias
- **Teléfono**: +1 (555) 123-4567 (24/7)
- **SMS**: +1 (555) 123-4568
- **Slack**: #security-incidents

---

*Esta guía establece el marco de seguridad para Twenty One Pilots, asegurando protección robusta de datos, cumplimiento normativo y respuesta efectiva a amenazas de seguridad.*