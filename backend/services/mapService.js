const locationService = require('./locationService');

class MapService {
  constructor() {
    this.defaultCenter = { lat: 40.7128, lng: -74.0060 }; // Nueva York por defecto
    this.defaultZoom = 10;
  }

  // Generar configuración de mapa para un concierto
  generateConcertMapConfig(concert) {
    if (!concert.location || !concert.latitude || !concert.longitude) {
      return null;
    }

    return {
      center: {
        lat: concert.latitude,
        lng: concert.longitude
      },
      zoom: 15,
      markers: [{
        id: `concert-${concert._id}`,
        position: {
          lat: concert.latitude,
          lng: concert.longitude
        },
        title: concert.name,
        description: `${concert.venue_name || 'Venue'} - ${new Date(concert.start_date).toLocaleDateString()}`,
        type: 'concert',
        data: {
          concertId: concert._id,
          name: concert.name,
          venue: concert.venue_name,
          date: concert.start_date,
          price: concert.price
        }
      }]
    };
  }

  // Generar mapa con múltiples conciertos
  generateConcertsMapConfig(concerts, userLocation = null) {
    if (!concerts || concerts.length === 0) {
      return this.getDefaultMapConfig();
    }

    const markers = concerts
      .filter(concert => concert.latitude && concert.longitude)
      .map(concert => ({
        id: `concert-${concert._id}`,
        position: {
          lat: concert.latitude,
          lng: concert.longitude
        },
        title: concert.name,
        description: `${concert.venue_name || 'Venue'} - ${new Date(concert.start_date).toLocaleDateString()}`,
        type: 'concert',
        data: {
          concertId: concert._id,
          name: concert.name,
          venue: concert.venue_name,
          date: concert.start_date,
          price: concert.price,
          city: concert.city
        }
      }));

    if (markers.length === 0) {
      return this.getDefaultMapConfig();
    }

    // Calcular centro del mapa basado en marcadores
    const center = this.calculateMapCenter(markers);

    return {
      center,
      zoom: this.calculateOptimalZoom(markers),
      markers,
      bounds: this.calculateBounds(markers),
      userLocation
    };
  }

  // Generar mapa de lugares cercanos
  async generateNearbyVenuesMap(userLat, userLng, radius = 10) {
    try {
      const nearbyPlaces = await locationService.findNearbyPlaces(userLat, userLng, radius, 'venue');

      const markers = nearbyPlaces.map((place, index) => ({
        id: `venue-${index}`,
        position: {
          lat: place.latitude,
          lng: place.longitude
        },
        title: place.formattedAddress || place.city,
        description: `Distancia: ${place.distance?.toFixed(1)} km`,
        type: 'venue',
        data: {
          address: place.formattedAddress,
          distance: place.distance
        }
      }));

      return {
        center: { lat: userLat, lng: userLng },
        zoom: 12,
        markers: [
          // Marcador del usuario
          {
            id: 'user-location',
            position: { lat: userLat, lng: userLng },
            title: 'Tu ubicación',
            type: 'user',
            icon: 'user'
          },
          ...markers
        ],
        userLocation: { lat: userLat, lng: userLng }
      };
    } catch (error) {
      console.error('Error generando mapa de lugares cercanos:', error);
      return this.getDefaultMapConfig();
    }
  }

  // Calcular centro óptimo del mapa
  calculateMapCenter(markers) {
    if (markers.length === 0) return this.defaultCenter;

    if (markers.length === 1) {
      return markers[0].position;
    }

    let totalLat = 0;
    let totalLng = 0;

    markers.forEach(marker => {
      totalLat += marker.position.lat;
      totalLng += marker.position.lng;
    });

    return {
      lat: totalLat / markers.length,
      lng: totalLng / markers.length
    };
  }

  // Calcular zoom óptimo basado en la dispersión de marcadores
  calculateOptimalZoom(markers) {
    if (markers.length <= 1) return 15;
    if (markers.length <= 3) return 12;
    if (markers.length <= 10) return 10;
    return 8;
  }

  // Calcular bounds del mapa
  calculateBounds(markers) {
    if (markers.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    markers.forEach(marker => {
      minLat = Math.min(minLat, marker.position.lat);
      maxLat = Math.max(maxLat, marker.position.lat);
      minLng = Math.min(minLng, marker.position.lng);
      maxLng = Math.max(maxLng, marker.position.lng);
    });

    return {
      northeast: { lat: maxLat, lng: maxLng },
      southwest: { lat: minLat, lng: minLng }
    };
  }

  // Configuración de mapa por defecto
  getDefaultMapConfig() {
    return {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      markers: []
    };
  }

  // Generar mapa con ruta entre puntos
  generateRouteMap(origin, destination, waypoints = []) {
    const markers = [
      {
        id: 'origin',
        position: origin,
        title: 'Origen',
        type: 'route-point'
      },
      {
        id: 'destination',
        position: destination,
        title: 'Destino',
        type: 'route-point'
      }
    ];

    // Agregar waypoints
    waypoints.forEach((waypoint, index) => {
      markers.push({
        id: `waypoint-${index}`,
        position: waypoint,
        title: `Parada ${index + 1}`,
        type: 'waypoint'
      });
    });

    return {
      center: this.calculateMapCenter(markers),
      zoom: 10,
      markers,
      route: {
        origin,
        destination,
        waypoints
      }
    };
  }

  // Generar mapa de calor para densidad de conciertos
  generateHeatmapData(concerts) {
    return concerts
      .filter(concert => concert.latitude && concert.longitude)
      .map(concert => ({
        lat: concert.latitude,
        lng: concert.longitude,
        weight: 1, // Podría ser basado en popularidad o asistencia
        data: {
          concertId: concert._id,
          name: concert.name,
          date: concert.start_date
        }
      }));
  }

  // Configuración de estilos de mapa
  getMapStyles() {
    return {
      light: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6c7b8b' }]
        }
      ],
      dark: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#000000' }, { lightness: 13 }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.fill',
          stylers: [{ color: '#000000' }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#144b53' }, { lightness: 14 }, { weight: 1.4 }]
        }
      ]
    };
  }
}

module.exports = new MapService();