const mapsService = require('../services/mapsService');
const notificationsService = require('../services/notificationsService');
const favoritesService = require('../services/favoritesService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class MapsController {
  /**
   * Geocodificar una dirección
   */
  async geocodeAddress(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { address } = req.query;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere una dirección'
        });
      }

      const result = await mapsService.geocodeAddress(address);

      res.json({
        success: true,
        data: { geocoding: result }
      });
    } catch (error) {
      logger.error('Error en geocodeAddress:', error);
      res.status(error.message.includes('no encontrada') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error geocodificando dirección'
      });
    }
  }

  /**
   * Reverse geocoding
   */
  async reverseGeocode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { lng, lat } = req.query;

      if (!lng || !lat) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren coordenadas lng y lat'
        });
      }

      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const result = await mapsService.reverseGeocode(coordinates);

      res.json({
        success: true,
        data: { reverseGeocoding: result }
      });
    } catch (error) {
      logger.error('Error en reverseGeocode:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error en reverse geocoding'
      });
    }
  }

  /**
   * Calcular ruta
   */
  async getRoute(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { originLng, originLat, destLng, destLat, profile } = req.query;

      if (!originLng || !originLat || !destLng || !destLat) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren coordenadas de origen y destino'
        });
      }

      const origin = [parseFloat(originLng), parseFloat(originLat)];
      const destination = [parseFloat(destLng), parseFloat(destLat)];

      const route = await mapsService.getRoute(origin, destination, { profile });

      res.json({
        success: true,
        data: { route }
      });
    } catch (error) {
      logger.error('Error en getRoute:', error);
      res.status(error.message.includes('no encontrada') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error calculando ruta'
      });
    }
  }

  /**
   * Obtener lugares cercanos
   */
  async getNearbyPlaces(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { lng, lat, radius, types, limit } = req.query;

      if (!lng || !lat) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren coordenadas lng y lat'
        });
      }

      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const options = {
        radius: radius ? parseInt(radius) : undefined,
        types,
        limit: limit ? parseInt(limit) : undefined
      };

      const result = await mapsService.getNearbyPlaces(coordinates, options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getNearbyPlaces:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo lugares cercanos'
      });
    }
  }

  /**
   * Obtener eventos cercanos
   */
  async getNearbyEvents(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { lng, lat, radius, limit } = req.query;

      if (!lng || !lat) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren coordenadas lng y lat'
        });
      }

      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const options = {
        radius: radius ? parseInt(radius) : undefined,
        limit: limit ? parseInt(limit) : undefined
      };

      const result = await mapsService.getNearbyEvents(coordinates, userId, options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getNearbyEvents:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo eventos cercanos'
      });
    }
  }

  /**
   * Obtener ubicaciones de Twenty One Pilots
   */
  async getTOPLocations(req, res) {
    try {
      const locations = await mapsService.getTOPLocations();

      res.json({
        success: true,
        data: { locations }
      });
    } catch (error) {
      logger.error('Error en getTOPLocations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo ubicaciones TOP'
      });
    }
  }

  /**
   * Crear mapa personalizado
   */
  async createCustomMap(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { layers, style, center, zoom } = req.body;

      if (!layers || !Array.isArray(layers)) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren capas para el mapa'
        });
      }

      const mapConfig = await mapsService.createCustomMap(layers, {
        style,
        center,
        zoom
      });

      res.json({
        success: true,
        data: { mapConfig }
      });
    } catch (error) {
      logger.error('Error en createCustomMap:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creando mapa personalizado'
      });
    }
  }

  /**
   * Agregar ubicación a favoritos
   */
  async addLocationToFavorites(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { locationId, name, coordinates, type, description, tags, notes } = req.body;

      const favoriteData = {
        name,
        coordinates,
        type: type || 'location',
        description,
        locationId
      };

      const favorite = await favoritesService.addToFavorites(
        userId,
        'location',
        locationId,
        favoriteData,
        {
          tags: tags || ['location'],
          notes: notes || `Ubicación: ${name}`,
          sendNotification: false
        }
      );

      res.status(201).json({
        success: true,
        message: 'Ubicación agregada a favoritos',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en addLocationToFavorites:', error);
      res.status(error.message === 'Item ya está en favoritos' ? 409 : 500).json({
        success: false,
        message: error.message || 'Error agregando ubicación a favoritos'
      });
    }
  }

  /**
   * Verificar si ubicación está en favoritos
   */
  async checkLocationFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { locationId } = req.params;

      const isFavorite = await favoritesService.isFavorite(userId, 'location', locationId);

      res.json({
        success: true,
        data: { isFavorite }
      });
    } catch (error) {
      logger.error('Error en checkLocationFavorite:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando favorito'
      });
    }
  }

  /**
   * Obtener ubicaciones favoritas
   */
  async getFavoriteLocations(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, type } = req.query;

      const filters = {
        itemType: 'location',
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      if (type) {
        filters.search = type;
      }

      const result = await favoritesService.getUserFavorites(userId, filters, {
        page: filters.page,
        limit: filters.limit
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getFavoriteLocations:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo ubicaciones favoritas'
      });
    }
  }

  /**
   * Obtener sugerencias de autocompletado
   */
  async getAutocompleteSuggestions(req, res) {
    try {
      const { q: query, limit, country, types } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }

      const options = {
        limit: limit ? parseInt(limit) : undefined,
        country,
        types
      };

      const result = await mapsService.getAutocompleteSuggestions(query, options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getAutocompleteSuggestions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo sugerencias'
      });
    }
  }

  /**
   * Verificar estado de Mapbox
   */
  async checkMapboxStatus(req, res) {
    try {
      const status = await mapsService.checkMapboxStatus();

      res.json({
        success: true,
        data: { mapboxStatus: status }
      });
    } catch (error) {
      logger.error('Error en checkMapboxStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando estado de Mapbox'
      });
    }
  }

  /**
   * Obtener estadísticas de mapas
   */
  async getMapsStats(req, res) {
    try {
      const userId = req.user.id;

      // Obtener estadísticas de favoritos de ubicaciones
      const stats = await favoritesService.getUserStats(userId);

      const mapsStats = {
        totalFavoriteLocations: stats.location?.count || 0,
        lastAddedLocation: stats.location?.lastAdded || null,
        favoriteLocationTypes: stats.location?.types || [],
        nearbyEventsChecked: stats.location?.nearbyEventsCount || 0
      };

      res.json({
        success: true,
        data: { stats: mapsStats }
      });
    } catch (error) {
      logger.error('Error en getMapsStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de mapas'
      });
    }
  }

  /**
   * Configurar notificaciones de ubicación
   */
  async configureLocationNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { enabled, radius, types } = req.body;

      // Aquí iríamos a guardar las preferencias del usuario
      // Por ahora, solo confirmamos
      logger.info('Preferencias de notificaciones de ubicación actualizadas', {
        userId,
        enabled,
        radius,
        types
      });

      res.json({
        success: true,
        message: 'Preferencias de notificaciones de ubicación actualizadas',
        data: { preferences: { enabled, radius, types } }
      });
    } catch (error) {
      logger.error('Error en configureLocationNotifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error configurando notificaciones de ubicación'
      });
    }
  }

  /**
   * Obtener preferencias de notificaciones de ubicación
   */
  async getLocationNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;

      // Aquí iríamos a obtener las preferencias del usuario
      // Por ahora, devolvemos valores por defecto
      const preferences = {
        enabled: true,
        radius: 50000, // 50km
        types: ['concert', 'store', 'event'],
        notifyForNearbyEvents: true,
        notifyForNewLocations: false
      };

      res.json({
        success: true,
        data: { preferences }
      });
    } catch (error) {
      logger.error('Error en getLocationNotificationPreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo preferencias de notificaciones'
      });
    }
  }
}

module.exports = new MapsController();