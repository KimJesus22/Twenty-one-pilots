const NodeGeocoder = require('node-geocoder');

class LocationService {
  constructor() {
    // Configurar geocoder con múltiples proveedores
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap', // Gratuito, sin límites
      // Alternativas: 'google', 'mapquest', 'here', etc.
    });

    // Configuración de fallback
    this.fallbackGeocoder = NodeGeocoder({
      provider: 'mapquest',
      apiKey: process.env.MAPQUEST_API_KEY || 'demo' // Usar demo para desarrollo
    });
  }

  // Geocodificar dirección a coordenadas
  async geocodeAddress(address) {
    try {
      const results = await this.geocoder.geocode(address);

      if (results && results.length > 0) {
        const result = results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
          city: result.city,
          state: result.state,
          country: result.country,
          zipcode: result.zipcode
        };
      }

      // Intentar con fallback
      const fallbackResults = await this.fallbackGeocoder.geocode(address);
      if (fallbackResults && fallbackResults.length > 0) {
        const result = fallbackResults[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
          city: result.city,
          state: result.state,
          country: result.country,
          zipcode: result.zipcode
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocodificando dirección:', error);
      return null;
    }
  }

  // Reverse geocoding: coordenadas a dirección
  async reverseGeocode(lat, lng) {
    try {
      const results = await this.geocoder.reverse({ lat, lon: lng });

      if (results && results.length > 0) {
        const result = results[0];
        return {
          formattedAddress: result.formattedAddress,
          city: result.city,
          state: result.state,
          country: result.country,
          zipcode: result.zipcode
        };
      }

      return null;
    } catch (error) {
      console.error('Error en reverse geocoding:', error);
      return null;
    }
  }

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Distancia en km
  }

  // Convertir grados a radianes
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Buscar lugares cercanos
  async findNearbyPlaces(lat, lng, radius = 10, type = 'venue') {
    try {
      // Usar reverse geocoding para encontrar lugares cercanos
      const results = await this.geocoder.reverse({ lat, lon: lng });

      // Filtrar por distancia
      const nearbyPlaces = results
        .filter(result => {
          if (result.latitude && result.longitude) {
            const distance = this.calculateDistance(lat, lng, result.latitude, result.longitude);
            return distance <= radius;
          }
          return false;
        })
        .map(result => ({
          ...result,
          distance: this.calculateDistance(lat, lng, result.latitude, result.longitude)
        }))
        .sort((a, b) => a.distance - b.distance);

      return nearbyPlaces;
    } catch (error) {
      console.error('Error buscando lugares cercanos:', error);
      return [];
    }
  }

  // Validar coordenadas
  validateCoordinates(lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return false;
    }

    return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  }

  // Formatear dirección
  formatAddress(location) {
    const parts = [];

    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    return parts.join(', ') || location.formattedAddress || 'Dirección no disponible';
  }
}

module.exports = new LocationService();