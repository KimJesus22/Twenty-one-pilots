# EventMapAdvanced Component

Un componente de mapa interactivo avanzado para la aplicación Twenty One Pilots que integra Google Maps con funcionalidades completas de navegación, ticketing y accesibilidad.

## 🚀 Características Principales

### 🗺️ **Mapa Interactivo Avanzado**
- **Google Maps Integration**: Mapa completo con todas las funcionalidades de Google Maps
- **Mapbox Fallback**: Soporte alternativo con Mapbox para mayor compatibilidad
- **Vista Satélite/Híbrida**: Múltiples estilos de mapa disponibles
- **Controles Completos**: Zoom, rotación, inclinación, vista de calle

### 🚗 **Navegación Inteligente**
- **Rutas en Tiempo Real**: Cálculo de rutas considerando tráfico actual
- **Múltiples Modos de Transporte**:
  - 🚗 Automóvil (con información de tráfico)
  - 🚇 Transporte público (metro, autobús, tren)
  - 🚶 Caminando
  - 🚴 Bicicleta
- **Estimación de Tiempos**: Duración con y sin tráfico
- **Navegación Paso a Paso**: Instrucciones detalladas con indicaciones visuales

### 🎫 **Sistema de Ticketing Integrado**
- **Selección Visual de Asientos**: Overlay interactivo sobre el mapa del venue
- **Disponibilidad en Tiempo Real**: Actualización automática de asientos ocupados
- **Precios Dinámicos**: Visualización de precios por zona/sección
- **Reserva Instantánea**: Reserva temporal con expiración automática
- **Validación de Asientos**: Prevención de reservas duplicadas

### ♿ **Accesibilidad Completa**
- **Verificación Automática**: Análisis de rutas para barreras de accesibilidad
- **Filtros de Accesibilidad**: Silla de ruedas, movilidad reducida, deficiencias visuales
- **Indicadores Visuales**: Marcas especiales para rutas accesibles
- **Información Detallada**: Descripción de posibles obstáculos

### 📍 **Geolocalización Avanzada**
- **Precisión Alta**: Uso de GPS con alta precisión cuando está disponible
- **Seguimiento Continuo**: Monitoreo de ubicación en tiempo real
- **Historial de Ubicación**: Análisis de patrones de movimiento
- **Notificaciones de Ubicación**: Alertas cuando se acerca a eventos

### 🔔 **Notificaciones Push**
- **Eventos Cercanos**: Notificación automática de eventos próximos
- **Actualizaciones de Ruta**: Cambios en tiempo estimado por tráfico
- **Recordatorios**: Alertas antes de eventos
- **Actualizaciones de Disponibilidad**: Cambios en ticketing

### 📱 **Experiencia Móvil Optimizada**
- **Responsive Design**: Funciona perfectamente en móviles y tablets
- **Controles Táctiles**: Optimizado para interacción táctil
- **Modo Offline**: Lista básica de eventos cuando no hay conexión
- **Batería Eficiente**: Optimización para preservar batería

## 📋 Props del Componente

```javascript
<EventMapAdvanced
  // Datos básicos
  events={[]}                    // Array de eventos
  selectedEvent={null}           // Evento actualmente seleccionado
  onEventSelect={(event) => {}}  // Callback para selección de evento
  userLocation={null}            // Ubicación del usuario {lat, lng}

  // Configuración del mapa
  height="600px"                 // Altura del componente
  apiKey="YOUR_GOOGLE_MAPS_KEY" // API Key de Google Maps
  enableOffline={false}          // Habilitar modo offline

  // Funcionalidades de navegación
  showTraffic={false}            // Mostrar capa de tráfico
  transportMode="driving"        // Modo de transporte predeterminado
  onRouteCalculated={(route) => {}} // Callback cuando se calcula ruta

  // Sistema de ticketing
  venueLayout={null}             // Layout del venue para selección de asientos
  selectedSeats={[]}             // Array de asientos seleccionados
  onSeatSelect={(seat) => {}}    // Callback para selección de asientos

  // Accesibilidad
  showAccessibility={false}      // Mostrar información de accesibilidad
  accessibilityNeeds={[]}        // Array de necesidades de accesibilidad

  // Notificaciones
  enableNotifications={false}    // Habilitar notificaciones push
/>
```

## 🎯 Modos de Transporte Soportados

| Modo | Icono | Descripción | Características |
|------|-------|-------------|----------------|
| `driving` | 🚗 | Automóvil | Tráfico en tiempo real, peajes, rutas alternativas |
| `transit` | 🚇 | Transporte público | Metro, autobús, tren, horarios en tiempo real |
| `walking` | 🚶 | Caminando | Rutas peatonales, accesibilidad |
| `bicycling` | 🚴 | Bicicleta | Ciclovías, rutas seguras |

## ♿ Necesidades de Accesibilidad

- **`wheelchair`**: Acceso para silla de ruedas
- **`mobility`**: Movilidad reducida
- **`visual`**: Deficiencias visuales
- **`hearing`**: Deficiencias auditivas

## 🔧 Configuración

### Variables de Entorno Requeridas

```bash
# Google Maps API Key (requerida)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Mapbox Token (opcional, fallback)
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

### Permisos del Navegador

El componente requiere los siguientes permisos:
- **Geolocalización**: Para ubicación precisa del usuario
- **Notificaciones**: Para alertas push (opcional)

## 📱 Ejemplos de Uso

### Mapa Básico
```javascript
<EventMapAdvanced
  events={events}
  onEventSelect={handleEventSelect}
  apiKey={apiKey}
/>
```

### Mapa Completo con Ticketing
```javascript
<EventMapAdvanced
  events={events}
  selectedEvent={selectedEvent}
  onEventSelect={handleEventSelect}
  userLocation={userLocation}
  apiKey={apiKey}
  showTraffic={true}
  transportMode="transit"
  venueLayout={venueLayout}
  selectedSeats={selectedSeats}
  onSeatSelect={handleSeatSelect}
  showAccessibility={true}
  accessibilityNeeds={['wheelchair']}
  enableNotifications={true}
/>
```

## 🎨 Personalización

### Estilos CSS
El componente incluye clases CSS personalizables:

```css
/* Controles del mapa */
.map-controls {
  /* Personalizar panel de controles */
}

/* Información de rutas */
.route-summary {
  /* Personalizar panel de rutas */
}

/* Marcadores de eventos */
.event-marker {
  /* Personalizar marcadores */
}

/* Asientos en mapa */
.seat-marker {
  /* Personalizar selección de asientos */
}
```

### Tema Oscuro
Soporte automático para tema oscuro basado en preferencias del sistema.

## 🔄 Estados y Callbacks

### Estados Internos
- **Loading**: Carga inicial del mapa
- **Error**: Estados de error con mensajes descriptivos
- **Offline**: Modo sin conexión con funcionalidad limitada

### Callbacks Disponibles
- `onEventSelect`: Selección de evento
- `onRouteCalculated`: Nueva ruta calculada
- `onSeatSelect`: Selección de asiento
- `onMapClick`: Click en el mapa

## 🚨 Consideraciones de Rendimiento

- **Lazy Loading**: El mapa se carga solo cuando es necesario
- **Clustering**: Agrupación automática de marcadores cercanos
- **Debouncing**: Optimización de llamadas a APIs
- **Cache**: Almacenamiento local de rutas calculadas

## 🐛 Solución de Problemas

### Problemas Comunes

1. **API Key no configurada**
   ```
   Error: Google Maps API key required
   Solución: Configurar REACT_APP_GOOGLE_MAPS_API_KEY
   ```

2. **Sin permisos de geolocalización**
   ```
   Error: Location permission denied
   Solución: Solicitar permisos al usuario o usar ubicación manual
   ```

3. **Sin conexión a internet**
   ```
   Modo offline activado automáticamente
   Funcionalidad limitada disponible
   ```

## 📈 Métricas y Analytics

El componente incluye análisis integrado de:
- **Uso del mapa**: Interacciones del usuario
- **Rutas calculadas**: Popularidad de modos de transporte
- **Eventos visitados**: Patrones de asistencia
- **Tiempo de carga**: Rendimiento del componente

## 🔮 Futuras Mejoras

- **Realidad Aumentada**: Guía visual con RA para navegación
- **Integración con Wearables**: Sincronización con relojes inteligentes
- **Modo Multiusuario**: Compartir rutas con amigos
- **Predicciones de Trafico**: IA para estimaciones avanzadas

---

**Desarrollado para Twenty One Pilots App** 🎵  
**Versión**: 2.0.0  
**Última actualización**: 2024