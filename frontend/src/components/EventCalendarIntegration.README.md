# 🎵 EventCalendarIntegration - Sistema Completo de Calendario y Recordatorios

Un sistema integral para gestionar eventos de conciertos con integración completa de calendarios, recordatorios inteligentes y mapas interactivos.

## 🚀 Características Principales

### 📅 **Integración Completa de Calendarios**
- **Google Calendar**: Sincronización directa con Google Calendar
- **iCal Export**: Descarga de archivos .ics compatibles con todos los calendarios
- **Eventos Detallados**: Título, artista, fecha, ubicación, precios, enlaces
- **Recordatorios Automáticos**: Configuración automática de alarmas
- **Zonas Horarias**: Manejo inteligente de zonas horarias

### 🔔 **Sistema de Recordatorios Inteligente**
- **Múltiples Tipos**:
  - ⏰ **Programados**: Recordatorios temporales (minutos, horas, días)
  - 📍 **Basados en Ubicación**: Activación automática al acercarse al venue
  - 📧 **Email**: Notificaciones por correo electrónico
  - 🚗 **Con Información de Ruta**: Incluye tiempo de viaje y distancia

### 🗺️ **Integración con Mapas Avanzados**
- **EventMapAdvanced**: Mapas interactivos con rutas en tiempo real
- **Selección Visual de Asientos**: Overlay interactivo sobre venues
- **Información de Accesibilidad**: Verificación automática de rutas
- **Transporte Público**: Integración con sistemas de transporte

### 📱 **Experiencia Móvil Optimizada**
- **Responsive Design**: Funciona perfectamente en móviles y tablets
- **Modo Compacto**: Componente minimalista para espacios reducidos
- **Notificaciones Push**: Alertas nativas del dispositivo
- **Acceso Rápido**: Botones de acción rápida

## 🛠️ Arquitectura del Sistema

### Servicios Principales

#### **CalendarService** (`calendarService.js`)
```javascript
// Características principales:
- Integración Google Calendar API
- Generación de archivos iCal
- Manejo de zonas horarias
- Eventos con metadatos completos
- Recordatorios automáticos
```

#### **NotificationService** (`notificationService.js`)
```javascript
// Funcionalidades:
- Notificaciones push del navegador
- Recordatorios programados
- Sistema basado en ubicación
- Notificaciones email (backend)
- Gestión de preferencias
```

#### **EventReminderManager** (`EventReminderManager.js`)
```javascript
// Componente principal:
- Interfaz unificada para calendarios y recordatorios
- Modo compacto y completo
- Configuración avanzada
- Integración con mapas
- Diseño accesible
```

## 📋 Configuración

### Variables de Entorno Requeridas

```bash
# Google Calendar API
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_API_KEY=your_google_api_key

# Opcional: Mapbox para mapas alternativos
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

### Instalación de Dependencias

```bash
npm install googleapis ical-generator moment-timezone
```

## 🎯 Uso del Sistema

### Implementación Básica

```javascript
import EventReminderManager from './components/EventReminderManager';
import EventMapAdvanced from './components/EventMapAdvanced';

function ConcertDetails({ event, userLocation }) {
  const handleReminderCreated = (result) => {
    console.log('Recordatorio creado:', result);
  };

  const handleCalendarExported = (result) => {
    console.log('Evento exportado:', result);
  };

  return (
    <div>
      {/* Mapa con funcionalidades avanzadas */}
      <EventMapAdvanced
        events={[event]}
        selectedEvent={event}
        userLocation={userLocation}
        apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        showTraffic={true}
        enableNotifications={true}
      />

      {/* Gestor de recordatorios y calendario */}
      <EventReminderManager
        event={event}
        userLocation={userLocation}
        onReminderCreated={handleReminderCreated}
        onCalendarExported={handleCalendarExported}
      />
    </div>
  );
}
```

### Modo Compacto

```javascript
// Para espacios reducidos o overlays
<EventReminderManager
  event={event}
  compact={true}
/>
```

### Configuración Avanzada

```javascript
<EventReminderManager
  event={event}
  userLocation={userLocation}
  onReminderCreated={handleReminderCreated}
  onCalendarExported={handleCalendarExported}
  // Configuración personalizada
  defaultReminderTime={120} // 2 horas por defecto
  defaultReminderUnit="minutes"
  enableLocationReminders={true}
  locationRadius={5} // 5km
/>
```

## 🔧 API Reference

### CalendarService

#### `initializeGoogleCalendar(clientId, apiKey)`
Inicializa la integración con Google Calendar.

#### `createCalendarEvent(eventData, provider)`
Crea un evento en el calendario especificado.
- `provider`: `'auto'`, `'google'`, `'ical'`

#### `generateICalEvent(eventData)`
Genera un archivo iCal para descarga.

#### `signInWithGoogle()`
Inicia sesión con Google para acceso a Calendar.

### NotificationService

#### `initialize()`
Inicializa el servicio de notificaciones.

#### `scheduleEventReminder(eventData, settings)`
Programa un recordatorio para un evento.

#### `cancelReminder(reminderId)`
Cancela un recordatorio programado.

#### `getNotificationPreferences()`
Obtiene las preferencias guardadas del usuario.

### EventReminderManager Props

| Prop | Tipo | Descripción | Default |
|------|------|-------------|---------|
| `event` | Object | Datos del evento | Required |
| `userLocation` | Object | Ubicación del usuario `{lat, lng}` | null |
| `onReminderCreated` | Function | Callback cuando se crea recordatorio | - |
| `onCalendarExported` | Function | Callback cuando se exporta evento | - |
| `compact` | Boolean | Modo compacto | false |

## 📱 Ejemplos de Recordatorios

### Recordatorio Programado
```javascript
const reminderSettings = {
  type: 'scheduled',
  value: 60,
  unit: 'minutes',
  includeRoute: true
};
```

### Recordatorio por Ubicación
```javascript
const reminderSettings = {
  type: 'location',
  radius: 5, // km
  includeRoute: false
};
```

### Recordatorio por Email
```javascript
const reminderSettings = {
  type: 'email',
  value: 1440, // 24 horas
  unit: 'minutes'
};
```

## 🎨 Personalización

### Estilos CSS
El sistema incluye clases CSS personalizables:

```css
/* Componente principal */
.event-reminder-manager {
  /* Personalizar contenedor principal */
}

/* Modo compacto */
.event-reminder-compact {
  /* Personalizar versión compacta */
}

/* Pestañas */
.reminder-tabs .tab-btn.active {
  /* Personalizar pestañas activas */
}

/* Botones */
.export-btn, .create-reminder-btn {
  /* Personalizar botones principales */
}
```

### Tema Oscuro
Soporte automático para preferencias de tema oscuro del sistema.

## ♿ Accesibilidad

### Características de Accesibilidad
- **Navegación por Teclado**: Soporte completo para navegación con teclado
- **Lectores de Pantalla**: Etiquetas ARIA y descripciones completas
- **Contraste Alto**: Soporte para modo de alto contraste
- **Reducción de Movimiento**: Respeta preferencias de movimiento reducido
- **Texto Escalable**: Diseño responsive que se adapta al zoom

### Cumplimiento WCAG
- **Nivel AA**: Cumple con las pautas WCAG 2.1 AA
- **Enfoque Visible**: Indicadores de foco claros
- **Texto Alternativo**: Descripciones para elementos visuales
- **Estructura Semántica**: Uso correcto de elementos HTML5

## 🔄 Estados y Callbacks

### Estados del Sistema
- **Cargando**: Operaciones en progreso
- **Error**: Estados de error con mensajes descriptivos
- **Éxito**: Confirmación de operaciones completadas
- **Sin Permisos**: Manejo de permisos denegados

### Eventos del Sistema
- `reminderCreated`: Nuevo recordatorio programado
- `calendarExported`: Evento exportado exitosamente
- `notificationSent`: Notificación enviada al usuario
- `locationReminderTriggered`: Recordatorio por ubicación activado

## 📊 Analytics e Información

### Métricas Recopiladas
- **Uso del Sistema**: Interacciones con calendarios y recordatorios
- **Preferencias**: Tipos de recordatorios más usados
- **Tasa de Éxito**: Porcentaje de exportaciones exitosas
- **Engagement**: Uso de notificaciones y recordatorios

### Información de Debug
```javascript
// Verificar estado de servicios
console.log('Calendar Service:', calendarService.getCalendarSupport());
console.log('Notification Service:', notificationService.getNotificationSupport());
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### Google Calendar no funciona
```
Error: Google API key not configured
Solucion: Configurar REACT_APP_GOOGLE_CLIENT_ID y REACT_APP_GOOGLE_API_KEY
```

#### Notificaciones no aparecen
```
Error: Notification permission denied
Solucion: Solicitar permisos al usuario o usar modo email
```

#### iCal no se descarga
```
Error: Browser security restriction
Solucion: Verificar configuración de CSP y permisos de descarga
```

#### Recordatorios no se activan
```
Error: Service worker not registered
Solucion: Registrar service worker para notificaciones push
```

## 🔮 Futuras Mejoras

### Funcionalidades Planificadas
- **Sincronización Bidireccional**: Actualización automática de cambios en calendarios
- **Recordatorios Recurrentes**: Eventos semanales/mensuales
- **Integración con Apps**: Conectores para Outlook, Apple Calendar
- **IA Predictiva**: Sugerencias automáticas basadas en comportamiento
- **Grupos y Compartir**: Recordatorios compartidos para grupos

### Mejoras Técnicas
- **PWA Completa**: Funcionalidad offline avanzada
- **Machine Learning**: Optimización de tiempos de recordatorio
- **Blockchain**: Verificación de tickets y eventos
- **VR/AR**: Visualización inmersiva de venues

---

## 📈 Impacto en la Aplicación

### Beneficios para Usuarios
- **🎯 Mejor Organización**: Eventos siempre accesibles en calendarios personales
- **⏰ Menos Estrés**: Recordatorios inteligentes evitan olvidar eventos
- **🚗 Planificación**: Rutas y tiempos integrados en recordatorios
- **♿ Accesibilidad**: Funciona para todos los tipos de usuarios
- **📱 Experiencia Móvil**: Optimizada para uso diario

### Métricas de Éxito
- **📊 Aumento de Asistencia**: Más usuarios asisten a eventos
- **💰 Mayor Engagement**: Interacciones más frecuentes con la app
- **⭐ Satisfacción**: Mejor experiencia general del usuario
- **🔄 Retención**: Usuarios regresan más frecuentemente

---

**Desarrollado para Twenty One Pilots App** 🎵  
**Versión**: 1.0.0  
**Última actualización**: 2024  
**Compatibilidad**: React 16.8+, Modern Browsers