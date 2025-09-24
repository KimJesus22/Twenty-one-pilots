class MapService {
  constructor() {
    this.googleMaps = null;
    this.mapboxClient = null;
    this.userLocation = null;
    this.locationWatchId = null;
    this.locationHistory = [];
    this.notificationsEnabled = false;
  }

  // Inicializar servicios de mapas
  async initialize(apiKeys = {}) {
    try {
      // Inicializar Google Maps si hay API key
      if (apiKeys.googleMaps && window.google) {
        this.googleMaps = window.google.maps;
      }

      // Inicializar Mapbox si hay API key
      if (apiKeys.mapbox) {
        // Importar dinámicamente para evitar errores si no está disponible
        const mapboxgl = await import('mapbox-gl');
        mapboxgl.accessToken = apiKeys.mapbox;
        this.mapboxClient = mapboxgl;
      }

      console.log('Map services initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing map services:', error);
      return false;
    }
  }

  // Geolocalización precisa con múltiples estrategias
  async getPreciseLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        ...options
      };

      // Intentar con alta precisión primero
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };

          this.userLocation = location;
          this.addToLocationHistory(location);

          resolve(location);
        },
        (error) => {
          console.warn('High accuracy location failed, trying with lower accuracy:', error);

          // Intentar con precisión baja como fallback
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
                fallback: true
              };

              this.userLocation = location;
              this.addToLocationHistory(location);

              resolve(location);
            },
            (error2) => {
              reject(new Error(`Location error: ${error.message} (fallback also failed: ${error2.message})`));
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000
            }
          );
        },
        defaultOptions
      );
    });
  }

  // Monitoreo continuo de ubicación
  startLocationTracking(options = {}) {
    if (this.locationWatchId) {
      this.stopLocationTracking();
    }

    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options
    };

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        this.userLocation = location;
        this.addToLocationHistory(location);

        // Notificar cambios de ubicación
        this.notifyLocationUpdate(location);
      },
      (error) => {
        console.error('Location tracking error:', error);
        this.notifyLocationError(error);
      },
      watchOptions
    );

    return this.locationWatchId;
  }

  // Detener monitoreo de ubicación
  stopLocationTracking() {
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  // Agregar ubicación al historial
  addToLocationHistory(location) {
    this.locationHistory.push({
      ...location,
      recordedAt: Date.now()
    });

    // Mantener solo las últimas 100 ubicaciones
    if (this.locationHistory.length > 100) {
      this.locationHistory = this.locationHistory.slice(-100);
    }
  }

  // Calcular ruta con Google Maps
  async calculateRoute(origin, destination, options = {}) {
    if (!this.googleMaps) {
      throw new Error('Google Maps not initialized');
    }

    const directionsService = new this.googleMaps.DirectionsService();

    const request = {
      origin: origin,
      destination: destination,
      travelMode: this.googleMaps.TravelMode[options.mode?.toUpperCase() || 'DRIVING'],
      drivingOptions: options.mode === 'driving' ? {
        departureTime: new Date(),
        trafficModel: 'bestguess'
      } : undefined,
      transitOptions: options.mode === 'transit' ? {
        departureTime: new Date(),
        modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN', 'TRAM']
      } : undefined,
      provideRouteAlternatives: true,
      ...options
    };

    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  }

  // Calcular ruta con Mapbox (fallback)
  async calculateRouteMapbox(origin, destination, options = {}) {
    if (!this.mapboxClient) {
      throw new Error('Mapbox not initialized');
    }

    const profile = this.getMapboxProfile(options.mode || 'driving');

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&overview=full&steps=true&access_token=${this.mapboxClient.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return this.convertMapboxToGoogleFormat(data.routes[0]);
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Mapbox routing error:', error);
      throw error;
    }
  }

  // Convertir respuesta de Mapbox al formato de Google Maps
  convertMapboxToGoogleFormat(mapboxRoute) {
    return {
      routes: [{
        legs: [{
          distance: {
            text: `${(mapboxRoute.distance / 1000).toFixed(1)} km`,
            value: mapboxRoute.distance
          },
          duration: {
            text: `${Math.round(mapboxRoute.duration / 60)} mins`,
            value: mapboxRoute.duration
          },
          steps: mapboxRoute.legs[0].steps.map(step => ({
            instructions: step.maneuver.instruction,
            distance: {
              text: `${(step.distance / 1000).toFixed(1)} km`,
              value: step.distance
            },
            duration: {
              text: `${Math.round(step.duration / 60)} mins`,
              value: step.duration
            }
          }))
        }],
        overview_path: mapboxRoute.geometry.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }))
      }]
    };
  }

  // Obtener perfil de Mapbox según modo de transporte
  getMapboxProfile(mode) {
    const profiles = {
      driving: 'mapbox/driving',
      walking: 'mapbox/walking',
      cycling: 'mapbox/cycling'
    };
    return profiles[mode] || 'mapbox/driving';
  }

  // Calcular distancia entre dos puntos
  calculateDistance(point1, point2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLng = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Convertir grados a radianes
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Notificaciones push para actualizaciones de eventos
  async enableNotifications() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      this.notificationsEnabled = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationsEnabled = permission === 'granted';
      return this.notificationsEnabled;
    }

    return false;
  }

  // Notificar actualización de ubicación
  notifyLocationUpdate(location) {
    if (this.notificationsEnabled && 'serviceWorker' in navigator) {
      // Enviar notificación push sobre ubicación actualizada
      this.sendNotification('Ubicación actualizada', {
        body: `Tu ubicación ha sido actualizada con precisión de ${Math.round(location.accuracy)}m`,
        icon: '/location-icon.png',
        tag: 'location-update'
      });
    }
  }

  // Notificar error de ubicación
  notifyLocationError(error) {
    if (this.notificationsEnabled) {
      this.sendNotification('Error de ubicación', {
        body: 'No se pudo obtener tu ubicación precisa',
        icon: '/error-icon.png',
        tag: 'location-error'
      });
    }
  }

  // Notificar eventos cercanos
  notifyNearbyEvents(events) {
    if (this.notificationsEnabled && events.length > 0) {
      const eventNames = events.slice(0, 3).map(e => e.title).join(', ');
      const moreText = events.length > 3 ? ` y ${events.length - 3} más` : '';

      this.sendNotification('Eventos cercanos encontrados', {
        body: `${eventNames}${moreText} están cerca de tu ubicación`,
        icon: '/event-icon.png',
        tag: 'nearby-events',
        data: { events: events.map(e => e._id) }
      });
    }
  }

  // Enviar notificación
  sendNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/badge.png',
        ...options
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }

  // Análisis de datos de ubicación
  getLocationAnalytics() {
    if (this.locationHistory.length === 0) {
      return null;
    }

    const analytics = {
      totalPoints: this.locationHistory.length,
      timeSpan: this.locationHistory.length > 1 ?
        this.locationHistory[this.locationHistory.length - 1].recordedAt - this.locationHistory[0].recordedAt : 0,
      averageAccuracy: this.locationHistory.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) / this.locationHistory.length,
      currentLocation: this.userLocation,
      locationHistory: this.locationHistory.slice(-10), // Últimas 10 ubicaciones
      movementPatterns: this.analyzeMovementPatterns()
    };

    return analytics;
  }

  // Analizar patrones de movimiento
  analyzeMovementPatterns() {
    if (this.locationHistory.length < 2) {
      return null;
    }

    const patterns = {
      totalDistance: 0,
      averageSpeed: 0,
      directionChanges: 0,
      stops: 0
    };

    let totalSpeed = 0;
    let speedCount = 0;

    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];

      // Calcular distancia
      const distance = this.calculateDistance(prev, curr);
      patterns.totalDistance += distance;

      // Calcular velocidad si hay timestamps
      if (prev.timestamp && curr.timestamp && prev.speed !== null) {
        totalSpeed += prev.speed;
        speedCount++;
      }

      // Detectar cambios de dirección
      if (prev.heading !== null && curr.heading !== null) {
        const headingDiff = Math.abs(curr.heading - prev.heading);
        if (headingDiff > 45) { // Cambio significativo de dirección
          patterns.directionChanges++;
        }
      }

      // Detectar paradas (velocidad muy baja)
      if (curr.speed !== null && curr.speed < 0.5) { // Menos de 0.5 m/s
        patterns.stops++;
      }
    }

    patterns.averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

    return patterns;
  }

  // Verificar accesibilidad de rutas
  async checkRouteAccessibility(route, accessibilityNeeds = []) {
    if (!route || !accessibilityNeeds.length) {
      return { accessible: true, issues: [] };
    }

    const issues = [];

    // Verificar cada paso de la ruta
    route.legs[0].steps.forEach((step, index) => {
      // Aquí irían verificaciones específicas de accesibilidad
      // Por ejemplo, verificar si hay escaleras, rampas, etc.

      if (accessibilityNeeds.includes('wheelchair')) {
        // Verificar accesibilidad para silla de ruedas
        if (step.instructions.toLowerCase().includes('escalera')) {
          issues.push({
            step: index,
            type: 'stairs',
            severity: 'high',
            message: 'Esta ruta incluye escaleras que pueden no ser accesibles'
          });
        }
      }

      if (accessibilityNeeds.includes('visual')) {
        // Verificar accesibilidad visual
        if (!step.instructions.includes('cruce peatonal')) {
          issues.push({
            step: index,
            type: 'crossing',
            severity: 'medium',
            message: 'Verificar señalización para cruce peatonal'
          });
        }
      }
    });

    return {
      accessible: issues.filter(i => i.severity === 'high').length === 0,
      issues
    };
  }

  // Obtener información de transporte público
  async getPublicTransportInfo(origin, destination) {
    if (!this.googleMaps) {
      return null;
    }

    try {
      const route = await this.calculateRoute(origin, destination, { mode: 'transit' });

      if (route.routes && route.routes[0]) {
        const transitInfo = {
          duration: route.routes[0].legs[0].duration,
          departureTime: new Date(),
          arrivalTime: new Date(Date.now() + route.routes[0].legs[0].duration.value * 1000),
          steps: route.routes[0].legs[0].steps.map(step => ({
            mode: step.travel_mode,
            instructions: step.instructions,
            duration: step.duration,
            distance: step.distance,
            transit_details: step.transit
          }))
        };

        return transitInfo;
      }
    } catch (error) {
      console.error('Error getting public transport info:', error);
    }

    return null;
  }

  // Limpiar datos
  clearLocationHistory() {
    this.locationHistory = [];
  }

  // Obtener estado del servicio
  getServiceStatus() {
    return {
      googleMapsAvailable: !!this.googleMaps,
      mapboxAvailable: !!this.mapboxClient,
      locationTrackingActive: !!this.locationWatchId,
      notificationsEnabled: this.notificationsEnabled,
      currentLocation: this.userLocation,
      locationHistorySize: this.locationHistory.length,
      isOnline: navigator.onLine
    };
  }
}

// Exportar instancia singleton
export default new MapService();