# 🛡️ reCAPTCHA v3 Integration - Twenty One Pilots

Esta guía documenta la implementación completa de Google reCAPTCHA v3 para protección contra bots y ataques automatizados en la aplicación Twenty One Pilots.

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Arquitectura](#-arquitectura)
- [Configuración](#-configuración)
- [Implementación](#-implementación)
- [Monitoreo](#-monitoreo)
- [Solución de Problemas](#-solución-de-problemas)
- [Mejores Prácticas](#-mejores-prácticas)

## 🎯 Visión General

### ¿Qué es reCAPTCHA v3?

Google reCAPTCHA v3 es un servicio avanzado de protección contra bots que utiliza machine learning para distinguir entre usuarios humanos y bots. A diferencia de las versiones anteriores, v3 opera en segundo plano sin requerir interacción del usuario.

### Características Implementadas

- ✅ **Verificación automática**: Sin desafíos visibles para usuarios
- ✅ **Puntuación de riesgo**: Score de 0.0 a 1.0 (1.0 = muy confiable)
- ✅ **Validación server-side**: Protección contra bypass
- ✅ **Acciones contextuales**: Diferentes umbrales por acción
- ✅ **Monitoreo completo**: Métricas en tiempo real
- ✅ **Auditoría**: Logging completo de verificaciones

### Beneficios

- **UX Mejorada**: Sin interrupciones para usuarios legítimos
- **Protección Robusta**: Detección avanzada de bots
- **Escalable**: Maneja alto volumen de tráfico
- **Configurable**: Umbrales ajustables por caso de uso
- **Monitoreable**: Visibilidad completa de efectividad

## 🏗️ Arquitectura

### Flujo de Verificación

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │───▶│ reCAPTCHA  │───▶│  Backend    │
│             │    │    v3      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Token Gen   │    │ Score Eval  │    │ Validation  │
│ (Browser)   │    │ (Google)    │    │ (Server)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Componentes del Sistema

#### **1. Servicio reCAPTCHA Backend**
```javascript
// backend/services/recaptchaService.js
const recaptchaService = {
  verifyToken(token, action, ip, userAgent),
  getStatistics(),
  validateConfiguration()
}
```

#### **2. Hook Frontend**
```javascript
// frontend/src/hooks/useRecaptcha.js
const { isEnabled, siteKey, executeRecaptcha } = useRecaptcha();
```

#### **3. Componente UI**
```javascript
// frontend/src/components/ReCaptcha.js
<ReCaptcha siteKey={siteKey} onVerify={handleVerify} action="login" />
```

#### **4. Controlador API**
```javascript
// backend/controllers/authController.js
await authService.validateRecaptchaForLogin(recaptchaToken, ip, userAgent);
```

## ⚙️ Configuración

### 1. Obtener Claves de Google

1. Ve a [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Haz clic en "Create" → "reCAPTCHA v3"
3. Configura:
   - **Label**: Twenty One Pilots
   - **reCAPTCHA type**: v3
   - **Domains**: `localhost`, `127.0.0.1`, `yourdomain.com`
4. Copia las claves generadas

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp recaptcha-config.example .env

# Editar con tus claves reales
nano .env
```

```env
# reCAPTCHA v3 Configuration
RECAPTCHA_SECRET_KEY=tu_clave_secreta_aqui
RECAPTCHA_SITE_KEY=tu_clave_sitio_aqui
RECAPTCHA_MINIMUM_SCORE=0.5
```

### 3. Ejecutar Setup Script

```bash
# Hacer ejecutable el script
chmod +x scripts/setup-recaptcha.sh

# Configurar reCAPTCHA
./scripts/setup-recaptcha.sh setup TU_SECRET_KEY TU_SITE_KEY

# Validar configuración
./scripts/setup-recaptcha.sh validate
```

### 4. Reiniciar Aplicación

```bash
# Backend
cd backend && npm restart

# Frontend (si es necesario)
cd frontend && npm start
```

## 💻 Implementación

### Endpoints Protegidos

#### **Autenticación**
```javascript
// Login con reCAPTCHA
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "recaptchaToken": "token_from_frontend"
}

// Registro con reCAPTCHA
POST /api/auth/register
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepass123",
  "recaptchaToken": "token_from_frontend"
}
```

#### **Configuración**
```javascript
// Obtener configuración para frontend
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

### Integración en Formularios

#### **Ejemplo: Formulario de Login**

```javascript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useRecaptcha from '../hooks/useRecaptcha';
import ReCaptcha from '../components/ReCaptcha';

const LoginForm = () => {
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const { isEnabled, siteKey, executeRecaptcha } = useRecaptcha();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    if (isEnabled && !recaptchaToken) {
      alert('Por favor completa la verificación reCAPTCHA');
      return;
    }

    // Enviar datos con token reCAPTCHA
    const result = await login({
      ...data,
      recaptchaToken
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos del formulario */}

      {isEnabled && siteKey && (
        <ReCaptcha
          siteKey={siteKey}
          onVerify={setRecaptchaToken}
          action="login"
        />
      )}

      <button type="submit" disabled={isEnabled && !recaptchaToken}>
        Iniciar Sesión
      </button>
    </form>
  );
};
```

### Acciones Soportadas

| Acción | Descripción | Umbral Recomendado |
|--------|-------------|-------------------|
| `login` | Inicio de sesión | 0.5 |
| `register` | Registro de usuario | 0.6 |
| `create_thread` | Crear hilo en foro | 0.7 |
| `submit` | Envío general | 0.5 |

## 📊 Monitoreo

### Dashboard de Grafana

El sistema incluye paneles dedicados en Grafana para monitoreo de reCAPTCHA:

#### **Métricas Disponibles**
- `recaptcha_verifications_total{success="true|false"}`
- `recaptcha_risk_total{level="very_low|low|medium|high|very_high"}`
- `recaptcha_score{action="login|register|create_thread"}`
- `recaptcha_failures_total{reason="low_score|invalid_token|expired"}`

#### **Paneles del Dashboard**
1. **Tendencias de Verificación**: Gráfico de verificaciones exitosas/fallidas
2. **Distribución de Riesgo**: Pie chart de niveles de riesgo
3. **Puntuación Promedio**: Gauge con score promedio
4. **Verificaciones Recientes**: Tabla de últimas verificaciones

### Alertas Configuradas

#### **Alertas Automáticas**
- **Alta tasa de fallos**: > 20% de fallos en 5 minutos
- **Score promedio bajo**: < 0.6 promedio en 10 minutos
- **Actividad sospechosa**: > 10 verificaciones de alto riesgo por hora

#### **Configuración de Alertas**
```yaml
# En alert_rules.yml
groups:
  - name: recaptcha_alerts
    rules:
      - alert: HighRecaptchaFailureRate
        expr: rate(recaptcha_verifications_total{success="false"}[5m]) / rate(recaptcha_verifications_total[5m]) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High reCAPTCHA failure rate detected"
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### **1. "reCAPTCHA not loaded"**
```javascript
// Verificar en browser console
console.log('reCAPTCHA loaded:', !!window.grecaptcha);

// Solución: Verificar conexión a internet y dominios configurados
```

#### **2. "Invalid site key"**
```javascript
// Verificar configuración
console.log('Site Key:', process.env.RECAPTCHA_SITE_KEY);

// Solución: Verificar que la clave coincida con el dominio
```

#### **3. Score siempre bajo**
```javascript
// Verificar configuración del sitio en Google
// Asegurarse de que el dominio esté agregado correctamente
// Considerar usar claves de test para desarrollo
```

#### **4. Token expirado**
```javascript
// Los tokens expiran después de 2 minutos
// Implementar renovación automática si es necesario
```

### Debugging

#### **Logs del Backend**
```bash
# Ver logs de verificación
tail -f backend/logs/recaptcha.log

# Verificar configuración
curl http://localhost:5000/api/auth/recaptcha/config
```

#### **Debugging del Frontend**
```javascript
// Verificar estado de reCAPTCHA
const { isEnabled, siteKey, executeRecaptcha } = useRecaptcha();
console.log('reCAPTCHA state:', { isEnabled, siteKey });

// Probar ejecución manual
const result = await executeRecaptcha('login');
console.log('Execution result:', result);
```

#### **Testing con Claves de Desarrollo**
```env
# Claves de test de Google (siempre devuelven score 0.9)
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

## 🎯 Mejores Prácticas

### Configuración de Seguridad

#### **Umbrales por Acción**
```javascript
const actionThresholds = {
  login: 0.5,        // Moderadamente estricto
  register: 0.6,     // Más estricto (nuevos usuarios)
  create_thread: 0.7, // Muy estricto (contenido generado)
  submit: 0.5        // Moderado para formularios generales
};
```

#### **Rate Limiting**
```javascript
// Implementar rate limiting adicional
const rateLimits = {
  login: { window: '15m', max: 5 },
  register: { window: '1h', max: 3 },
  general: { window: '1m', max: 10 }
};
```

### UX Considerations

#### **Indicadores Visuales**
- ✅ Mostrar indicador de carga durante verificación
- ✅ Feedback visual cuando la verificación es exitosa
- ✅ Mensajes de error claros y útiles
- ✅ Reintentos automáticos para fallos temporales

#### **Accesibilidad**
- 🔹 Soporte completo para lectores de pantalla
- 🔹 Navegación por teclado
- 🔹 Contraste adecuado de colores
- 🔹 Texto alternativo descriptivo

### Performance

#### **Optimizaciones**
- 📦 **Carga diferida**: Solo cargar script cuando sea necesario
- ⚡ **Cache**: Cache de configuración de reCAPTCHA
- 🔄 **Reintentos**: Lógica de reintento para fallos temporales
- 📊 **Monitoreo**: Alertas de performance

### Mantenimiento

#### **Tareas de Mantenimiento**
- 🔄 **Rotación de claves**: Anualmente según recomendaciones de Google
- 📈 **Ajuste de umbrales**: Basado en análisis de métricas
- 🧹 **Limpieza de logs**: Política de retención de logs
- 📊 **Revisión de métricas**: Análisis mensual de efectividad

#### **Actualizaciones**
- 📅 **Mantener versión actual**: Actualizar a nuevas versiones de reCAPTCHA
- 🔍 **Monitorear cambios**: Estar al tanto de cambios en la API
- 🧪 **Testing**: Probar cambios en entorno de staging
- 📚 **Documentación**: Mantener documentación actualizada

## 📞 Soporte

### Recursos Adicionales

- **Documentación oficial**: https://developers.google.com/recaptcha/docs/v3
- **Consola de administración**: https://www.google.com/recaptcha/admin
- **Soporte de Google**: https://support.google.com/recaptcha

### Contactos del Proyecto

- **Issues**: [GitHub Issues](https://github.com/twentyonepilots/app/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/twentyonepilots/app/discussions)
- **Email**: security@twentyonepilots.com

---

## 🚀 Checklist de Implementación

- [ ] Obtener claves de Google reCAPTCHA
- [ ] Configurar variables de entorno
- [ ] Ejecutar script de setup
- [ ] Reiniciar aplicación
- [ ] Probar formularios de login/registro
- [ ] Verificar métricas en Grafana
- [ ] Configurar alertas
- [ ] Documentar configuración específica

¡La protección contra bots con reCAPTCHA v3 está ahora completamente integrada en Twenty One Pilots! 🎉