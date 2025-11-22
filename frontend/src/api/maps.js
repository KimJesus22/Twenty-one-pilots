const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class MapsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/maps`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Geocodificar dirección
  async geocodeAddress(address) {
    const response = await this.request(`/geocode?address=${encodeURIComponent(address)}`);
    return response;
  }

  // Reverse geocoding
  async reverseGeocode(coordinates) {
    const [lng, lat] = coordinates;
    const response = await this.request(`/reverse-geocode?lng=${lng}&lat=${lat}`);
    return response;
  }

  // Calcular ruta
  async getRoute(origin, destination, options = {}) {
    const [originLng, originLat] = origin;
    const [destLng, destLat] = destination;

    const params = new URLSearchParams({
      originLng: originLng.toString(),
      originLat: originLat.toString(),
      destLng: destLng.toString(),
      destLat: destLat.toString()
    });

    if (options.profile) params.append('profile', options.profile);

    const response = await this.request(`/route?${params.toString()}`);
    return response;
  }

  // Obtener lugares cercanos
  async getNearbyPlaces(coordinates, options = {}) {
    const [lng, lat] = coordinates;
    const params = new URLSearchParams({
      lng: lng.toString(),
      lat: lat.toString()
    });

    if (options.radius) params.append('radius', options.radius.toString());
    if (options.types) params.append('types', options.types);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await this.request(`/nearby/places?${params.toString()}`);
    return response;
  }

  // Obtener eventos cercanos
  async getNearbyEvents(coordinates, options = {}) {
    const [lng, lat] = coordinates;
    const params = new URLSearchParams({
      lng: lng.toString(),
      lat: lat.toString()
    });

    if (options.radius) params.append('radius', options.radius.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await this.request(`/nearby/events?${params.toString()}`);
    return response;
  }

  // Obtener ubicaciones de Twenty One Pilots
  async getTOPLocations() {
    const response = await this.request('/top-locations');
    return response;
  }

  // Crear mapa personalizado
  async createCustomMap(mapConfig) {
    const response = await this.request('/custom', {
      method: 'POST',
      body: JSON.stringify(mapConfig),
    });
    return response;
  }

  // Agregar ubicación a favoritos
  async addLocationToFavorites(locationData) {
    const response = await this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
    return response;
  }

  // Verificar si ubicación está en favoritos
  async checkLocationFavorite(locationId) {
    const response = await this.request(`/favorites/check/${locationId}`);
    return response;
  }

  // Obtener ubicaciones favoritas
  async getFavoriteLocations(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/favorites?${queryString}` : '/favorites';

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener sugerencias de autocompletado
  async getAutocompleteSuggestions(query, options = {}) {
    const params = new URLSearchParams({ q: query });

    if (options.limit) params.append('limit', options.limit.toString());
    if (options.country) params.append('country', options.country);
    if (options.types) params.append('types', options.types);

    const response = await this.request(`/autocomplete?${params.toString()}`);
    return response;
  }

  // Verificar estado de Mapbox
  async checkMapboxStatus() {
    const response = await this.request('/status');
    return response;
  }

  // Obtener estadísticas de mapas
  async getMapsStats() {
    const response = await this.request('/stats');
    return response;
  }

  // Configurar notificaciones de ubicación
  async configureLocationNotifications(preferences) {
    const response = await this.request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
    return response;
  }

  // Obtener preferencias de notificaciones de ubicación
  async getLocationNotificationPreferences() {
    const response = await this.request('/notifications/preferences');
    return response;
  }
}

export default new MapsAPI();
