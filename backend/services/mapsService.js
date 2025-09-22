const axios = require('axios');
const cacheService = require('./cacheService');
const notificationsService = require('./notificationsService');
const logger = require('../utils/logger');

class MapsService {
  constructor() {
    this.CACHE_TTL = {
      geocoding: 2592000,    // 30 días para geocoding
      places: 86400,         // 24 horas para lugares
      routes: 3600,          // 1 hora para rutas
      nearby_events: 1800    // 30 minutos para eventos cercanos
    };

    // Configuración de Mapbox
    this.mapbox = {
      accessToken: process.env.MAPBOX_ACCESS_TOKEN,
      baseUrl: 'https://api.mapbox.com',
      enabled: !!process.env.MAPBOX_ACCESS_TOKEN
    };

    // Configuración de ubicaciones de Twenty One Pilots
    this.topLocations = {
      // Lugares mencionados en canciones
      songLocations: [
        {
          id: 'ohio_city',
          name: 'Ohio City',
          coordinates: [-81.6954, 41.4993],
          song: 'Ohio Is For Lovers',
          description: 'Ciudad mencionada en la canción Ohio Is For Lovers'
        },
        {
          id: 'columbus_ohio',
          name: 'Columbus, Ohio',
          coordinates: [-82.9988, 39.9612],
          description: 'Ciudad natal de Tyler Joseph'
        },
        {
          id: 'los_angeles',
          name: 'Los Angeles, CA',
          coordinates: [-118.2437, 34.0522],
          description: 'Ciudad donde grabaron parte de sus álbumes'
        }
      ],

      // Tiendas oficiales
      officialStores: [
        {
          id: 'store_columbus',
          name: 'Twenty One Pilots Official Store - Columbus',
          coordinates: [-82.9988, 39.9612],
          type: 'store',
          address: '123 Main St, Columbus, OH'
        },
        {
          id: 'store_los_angeles',
          name: 'Twenty One Pilots Official Store - LA',
          coordinates: [-118.2437, 34.0522],
          type: 'store',
          address: '456 Sunset Blvd, Los Angeles, CA'
        }
      ]
    };
  }

  /**
   * Geocodificar una dirección
   */
  async geocodeAddress(address, options = {}) {
    try {
      if (!this.mapbox.enabled) {
        throw new Error('Mapbox no está configurado');
      }

      const cacheKey = `maps:geocode:${address}`;

      // Intentar obtener del caché
      if (!options.skipCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = new URLSearchParams({
        access_token: this.mapbox.accessToken,
        limit: 1,
        types: 'address,poi'
      });

      const response = await axios.get(
        `${this.mapbox.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        { params, timeout: 10000 }
      );

      if (response.data.features.length === 0) {
        throw new Error('Dirección no encontrada');
      }

      const feature = response.data.features[0];
      const result = {
        address: feature.place_name,
        coordinates: feature.center,
        bbox: feature.bbox,
        context: feature.context,
        geocodedAt: new Date().toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.geocoding);

      return result;
    } catch (error) {
      logger.error('Error geocodificando dirección:', error);
      throw error;
    }
  }

  /**
   * Geocodificar coordenadas (reverse geocoding)
   */
  async reverseGeocode(coordinates, options = {}) {
    try {
      if (!this.mapbox.enabled) {
        throw new Error('Mapbox no está configurado');
      }

      const [lng, lat] = coordinates;
      const cacheKey = `maps:reverse:${lat}_${lng}`;

      // Intentar obtener del caché
      if (!options.skipCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = new URLSearchParams({
        access_token: this.mapbox.accessToken,
        types: 'address,poi,place'
      });

      const response = await axios.get(
        `${this.mapbox.baseUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        { params, timeout: 10000 }
      );

      if (response.data.features.length === 0) {
        throw new Error('Ubicación no encontrada');
      }

      const feature = response.data.features[0];
      const result = {
        coordinates: [lng, lat],
        address: feature.place_name,
        placeName: feature.text,
        context: feature.context,
        properties: feature.properties,
        reverseGeocodedAt: new Date().toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.geocoding);

      return result;
    } catch (error) {
      logger.error('Error en reverse geocoding:', error);
      throw error;
    }
  }

  /**
   * Calcular ruta entre dos puntos
   */
  async getRoute(origin, destination, options = {}) {
    try {
      if (!this.mapbox.enabled) {
        throw new Error('Mapbox no está configurado');
      }

      const [originLng, originLat] = origin;
      const [destLng, destLat] = destination;
      const profile = options.profile || 'driving'; // driving, walking, cycling

      const cacheKey = `maps:route:${profile}:${originLat}_${originLng}:${destLat}_${destLng}`;

      // Intentar obtener del caché
      if (!options.skipCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = new URLSearchParams({
        access_token: this.mapbox.accessToken,
        geometries: 'geojson',
        overview: 'full',
        steps: true
      });

      const response = await axios.get(
        `${this.mapbox.baseUrl}/directions/v5/mapbox/${profile}/${originLng},${originLat};${destLng},${destLat}`,
        { params, timeout: 15000 }
      );

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('Ruta no encontrada');
      }

      const route = response.data.routes[0];
      const result = {
        origin,
        destination,
        profile,
        distance: route.distance, // en metros
        duration: route.duration, // en segundos
        geometry: route.geometry,
        steps: route.legs[0].steps,
        summary: route.legs[0].summary,
        calculatedAt: new Date().toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.routes);

      return result;
    } catch (error) {
      logger.error('Error calculando ruta:', error);
      throw error;
    }
  }

  /**
   * Obtener lugares cercanos
   */
  async getNearbyPlaces(coordinates, options = {}) {
    try {
      if (!this.mapbox.enabled) {
        throw new Error('Mapbox no está configurado');
      }

      const [lng, lat] = coordinates;
      const radius = options.radius || 1000; // 1km por defecto
      const types = options.types || 'poi';
      const limit = options.limit || 10;

      const cacheKey = `maps:nearby:${lat}_${lng}:${radius}:${types}:${limit}`;

      // Intentar obtener del caché
      if (!options.skipCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = new URLSearchParams({
        access_token: this.mapbox.accessToken,
        limit,
        types,
        proximity: `${lng},${lat}`
      });

      const response = await axios.get(
        `${this.mapbox.baseUrl}/geocoding/v5/mapbox.places/.json`,
        { params, timeout: 10000 }
      );

      const result = {
        center: coordinates,
        radius,
        places: response.data.features.map(feature => ({
          id: feature.id,
          name: feature.text,
          address: feature.place_name,
          coordinates: feature.center,
          category: feature.properties?.category,
          distance: this.calculateDistance(coordinates, feature.center)
        })).sort((a, b) => a.distance - b.distance),
        searchedAt: new Date().toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.places);

      return result;
    } catch (error) {
      logger.error('Error obteniendo lugares cercanos:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos cercanos (conciertos)
   */
  async getNearbyEvents(userCoordinates, userId, options = {}) {
    try {
      const radius = options.radius || 50000; // 50km por defecto
      const cacheKey = `maps:events:${userCoordinates.join('_')}:${radius}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Obtener conciertos próximos (esto vendría de la base de datos de conciertos)
      const Concert = require('../models/Concert');
      const upcomingConcerts = await Concert.find({
        date: { $gte: new Date() },
        isActive: true
      }).limit(50);

      const nearbyEvents = [];

      for (const concert of upcomingConcerts) {
        if (concert.coordinates) {
          const distance = this.calculateDistance(userCoordinates, concert.coordinates);

          if (distance <= radius) {
            nearbyEvents.push({
              id: concert._id,
              name: concert.name,
              venue: concert.venue,
              date: concert.date,
              coordinates: concert.coordinates,
              distance,
              artist: 'Twenty One Pilots'
            });
          }
        }
      }

      // Ordenar por distancia
      nearbyEvents.sort((a, b) => a.distance - b.distance);

      const result = {
        userCoordinates,
        radius,
        events: nearbyEvents.slice(0, options.limit || 20),
        totalNearby: nearbyEvents.length,
        searchedAt: new Date().toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.nearby_events);

      // Enviar notificaciones push si hay eventos muy cercanos (< 10km)
      const veryCloseEvents = nearbyEvents.filter(event => event.distance < 10000);
      if (veryCloseEvents.length > 0 && userId) {
        await this.sendNearbyEventNotifications(userId, veryCloseEvents);
      }

      return result;
    } catch (error) {
      logger.error('Error obteniendo eventos cercanos:', error);
      throw error;
    }
  }

  /**
   * Obtener ubicaciones de Twenty One Pilots
   */
  async getTOPLocations(options = {}) {
    try {
      const result = {
        songLocations: this.topLocations.songLocations,
        officialStores: this.topLocations.officialStores,
        tourRoutes: await this.getTourRoutes(),
        lastUpdated: new Date().toISOString()
      };

      return result;
    } catch (error) {
      logger.error('Error obteniendo ubicaciones TOP:', error);
      throw error;
    }
  }

  /**
   * Obtener rutas de gira
   */
  async getTourRoutes() {
    try {
      // En producción, esto vendría de la base de datos de tours
      // Por ahora, devolver rutas simuladas
      return [
        {
          id: 'trench_tour_2019',
          name: 'The Bandito Tour (Trench Era)',
          year: 2019,
          stops: [
            { city: 'Columbus', coordinates: [-82.9988, 39.9612], date: '2019-03-15' },
            { city: 'Chicago', coordinates: [-87.6298, 41.8781], date: '2019-03-18' },
            { city: 'New York', coordinates: [-74.0060, 40.7128], date: '2019-03-22' },
            { city: 'Los Angeles', coordinates: [-118.2437, 34.0522], date: '2019-04-01' }
          ]
        }
      ];
    } catch (error) {
      logger.error('Error obteniendo rutas de gira:', error);
      return [];
    }
  }

  /**
   * Crear mapa personalizado con capas
   */
  async createCustomMap(layers, options = {}) {
    try {
      const mapConfig = {
        style: options.style || 'mapbox://styles/mapbox/streets-v11',
        center: options.center || [-98.5795, 39.8283], // Centro de EE.UU.
        zoom: options.zoom || 4,
        layers: layers.map(layer => ({
          id: layer.id,
          type: layer.type || 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: layer.features
            }
          },
          paint: layer.paint || {}
        })),
        createdAt: new Date().toISOString()
      };

      return mapConfig;
    } catch (error) {
      logger.error('Error creando mapa personalizado:', error);
      throw error;
    }
  }

  /**
   * Enviar notificaciones de eventos cercanos
   */
  async sendNearbyEventNotifications(userId, events) {
    try {
      for (const event of events.slice(0, 3)) { // Máximo 3 notificaciones
        await notificationsService.createNotification(userId, {
          type: 'event_reminder',
          title: `🎵 ¡Concierto cercano!`,
          message: `${event.name} en ${event.venue} - ${Math.round(event.distance / 1000)}km de distancia`,
          data: {
            itemId: event.id,
            itemType: 'concert',
            itemTitle: event.name,
            coordinates: event.coordinates,
            distance: event.distance
          },
          channels: ['push', 'in_app'],
          priority: 'high'
        });
      }

      logger.info('Notificaciones de eventos cercanos enviadas', {
        userId,
        eventsCount: events.length
      });
    } catch (error) {
      logger.error('Error enviando notificaciones de eventos cercanos:', error);
    }
  }

  /**
   * Calcular distancia entre dos puntos (fórmula de Haversine)
   */
  calculateDistance(coord1, coord2) {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  }

  /**
   * Limpiar caché de mapas
   */
  async clearMapsCache() {
    try {
      const patterns = ['maps:*'];
      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
      logger.info('Cache de mapas limpiado');
    } catch (error) {
      logger.error('Error limpiando cache de mapas:', error);
    }
  }

  /**
   * Verificar estado de Mapbox
   */
  async checkMapboxStatus() {
    try {
      if (!this.mapbox.enabled) {
        return { enabled: false, status: 'disabled' };
      }

      const response = await axios.get(`${this.mapbox.baseUrl}/geocoding/v5/mapbox.places/test.json`, {
        params: { access_token: this.mapbox.accessToken, limit: 1 },
        timeout: 5000
      });

      return {
        enabled: true,
        status: response.status === 200 ? 'ok' : 'error',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        enabled: true,
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener sugerencias de autocompletado
   */
  async getAutocompleteSuggestions(query, options = {}) {
    try {
      if (!this.mapbox.enabled) {
        throw new Error('Mapbox no está configurado');
      }

      const params = new URLSearchParams({
        access_token: this.mapbox.accessToken,
        limit: options.limit || 5,
        types: options.types || 'place,postcode,locality,neighborhood,address'
      });

      if (options.country) {
        params.append('country', options.country);
      }

      const response = await axios.get(
        `${this.mapbox.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        { params, timeout: 5000 }
      );

      return {
        query,
        suggestions: response.data.features.map(feature => ({
          id: feature.id,
          text: feature.text,
          placeName: feature.place_name,
          coordinates: feature.center,
          relevance: feature.relevance
        })),
        searchedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo sugerencias de autocompletado:', error);
      throw error;
    }
  }
}

module.exports = new MapsService();