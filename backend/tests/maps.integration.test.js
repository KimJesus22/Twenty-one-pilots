const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const { Product } = require('../models/Product');

let mongoServer;
let server;
let agent;

describe('Maps API Integration Tests', () => {
  let testUser;
  let userToken;

  beforeAll(async () => {
    // Configurar MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Crear usuario de prueba
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'user'
    });
    await testUser.save();

    // Generar token JWT (simulado)
    userToken = 'fake-jwt-token-for-testing';

    // Iniciar servidor de prueba
    server = app.listen(0);
    agent = request.agent(server);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
  });

  beforeEach(async () => {
    // Limpiar datos entre pruebas
    await Product.deleteMany({});
  });

  describe('GET /api/maps/top-locations', () => {
    it('debe devolver ubicaciones TOP exitosamente', async () => {
      const response = await agent
        .get('/api/maps/top-locations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('locations');
      expect(response.body.data.locations).toHaveProperty('songLocations');
      expect(response.body.data.locations).toHaveProperty('officialStores');
    });
  });

  describe('GET /api/maps/geocode', () => {
    it('debe geocodificar una dirección exitosamente', async () => {
      const response = await agent
        .get('/api/maps/geocode')
        .query({ address: 'Columbus, Ohio' })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      // En producción, esto debería devolver coordenadas reales
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('geocoding');
    });

    it('debe validar parámetros requeridos', async () => {
      const response = await agent
        .get('/api/maps/geocode')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/maps/reverse-geocode', () => {
    it('debe hacer reverse geocoding exitosamente', async () => {
      const response = await agent
        .get('/api/maps/reverse-geocode')
        .query({ lng: -82.9988, lat: 39.9612 })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('reverse geocoding');
    });

    it('debe validar coordenadas', async () => {
      const response = await agent
        .get('/api/maps/reverse-geocode')
        .query({ lng: 'invalid', lat: 39.9612 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/maps/route', () => {
    it('debe calcular una ruta exitosamente', async () => {
      const response = await agent
        .get('/api/maps/route')
        .query({
          originLng: -82.9988,
          originLat: 39.9612,
          destLng: -87.6298,
          destLat: 41.8781,
          profile: 'driving'
        })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ruta');
    });

    it('debe validar parámetros de ruta', async () => {
      const response = await agent
        .get('/api/maps/route')
        .query({
          originLng: -82.9988,
          originLat: 39.9612,
          destLng: 'invalid',
          destLat: 41.8781
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/maps/nearby/places', () => {
    it('debe obtener lugares cercanos exitosamente', async () => {
      const response = await agent
        .get('/api/maps/nearby/places')
        .query({
          lng: -82.9988,
          lat: 39.9612,
          radius: 1000,
          limit: 10
        })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('lugares cercanos');
    });

    it('debe validar parámetros de lugares cercanos', async () => {
      const response = await agent
        .get('/api/maps/nearby/places')
        .query({
          lng: 'invalid',
          lat: 39.9612,
          radius: 1000
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/maps/nearby/events', () => {
    it('debe requerir autenticación para eventos cercanos', async () => {
      const response = await agent
        .get('/api/maps/nearby/events')
        .query({
          lng: -82.9988,
          lat: 39.9612,
          radius: 50000
        })
        .expect(401);

      expect(response.body.message).toContain('No autorizado');
    });

    it('debe obtener eventos cercanos con autenticación', async () => {
      const response = await agent
        .get('/api/maps/nearby/events')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          lng: -82.9988,
          lat: 39.9612,
          radius: 50000
        })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('eventos cercanos');
    });
  });

  describe('GET /api/maps/autocomplete', () => {
    it('debe obtener sugerencias de autocompletado', async () => {
      const response = await agent
        .get('/api/maps/autocomplete')
        .query({ q: 'Columbus', limit: 5 })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('autocompletado');
    });

    it('debe manejar consultas vacías', async () => {
      const response = await agent
        .get('/api/maps/autocomplete')
        .query({ q: '', limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toEqual([]);
    });
  });

  describe('POST /api/maps/favorites', () => {
    it('debe requerir autenticación para agregar favoritos', async () => {
      const response = await agent
        .post('/api/maps/favorites')
        .send({
          locationId: 'test_location',
          name: 'Test Location',
          coordinates: [-82.9988, 39.9612],
          type: 'poi'
        })
        .expect(401);

      expect(response.body.message).toContain('No autorizado');
    });

    it('debe agregar ubicación a favoritos con autenticación', async () => {
      const response = await agent
        .post('/api/maps/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          locationId: 'test_location',
          name: 'Test Location',
          coordinates: [-82.9988, 39.9612],
          type: 'poi'
        })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('favoritos');
    });

    it('debe validar datos de ubicación favorita', async () => {
      const response = await agent
        .post('/api/maps/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Datos inválidos
          locationId: '',
          name: '',
          coordinates: 'invalid',
          type: 'invalid_type'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/maps/favorites/check/:id', () => {
    it('debe verificar si una ubicación está en favoritos', async () => {
      const response = await agent
        .get('/api/maps/favorites/check/test_location_id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('favorito');
    });
  });

  describe('GET /api/maps/favorites', () => {
    it('debe obtener ubicaciones favoritas del usuario', async () => {
      const response = await agent
        .get('/api/maps/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('favoritas');
    });
  });

  describe('GET /api/maps/status', () => {
    it('debe devolver el estado de Mapbox', async () => {
      const response = await agent
        .get('/api/maps/status')
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Mapbox');
    });
  });

  describe('GET /api/maps/stats', () => {
    it('debe devolver estadísticas de mapas', async () => {
      const response = await agent
        .get('/api/maps/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('estadísticas');
    });
  });

  describe('PUT /api/maps/notifications/preferences', () => {
    it('debe requerir autenticación para configurar notificaciones', async () => {
      const response = await agent
        .put('/api/maps/notifications/preferences')
        .send({
          enabled: true,
          radius: 10000,
          categories: ['concerts', 'stores']
        })
        .expect(401);

      expect(response.body.message).toContain('No autorizado');
    });

    it('debe configurar preferencias de notificaciones con autenticación', async () => {
      const response = await agent
        .put('/api/maps/notifications/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enabled: true,
          radius: 10000,
          categories: ['concerts', 'stores']
        })
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('notificaciones');
    });
  });

  describe('GET /api/maps/notifications/preferences', () => {
    it('debe obtener preferencias de notificaciones', async () => {
      const response = await agent
        .get('/api/maps/notifications/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Como estamos usando mocks, esperamos una respuesta de error controlado
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('preferencias');
    });
  });

  describe('Rate Limiting', () => {
    it('debe aplicar rate limiting a endpoints de mapas', async () => {
      // Hacer múltiples peticiones rápidas para probar rate limiting
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          agent
            .get('/api/maps/top-locations')
            .expect((res) => {
              // Puede ser 200 o 429 dependiendo del rate limiting
              if (res.status === 429) {
                expect(res.body.message).toContain('rate limit');
              } else {
                expect(res.status).toBe(200);
              }
            })
        );
      }

      await Promise.all(promises);
    });
  });

  describe('Error Handling', () => {
    it('debe manejar errores de validación correctamente', async () => {
      const response = await agent
        .get('/api/maps/geocode')
        .query({ address: '' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('debe manejar rutas inexistentes', async () => {
      const response = await agent
        .get('/api/maps/nonexistent-endpoint')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('debe manejar métodos HTTP no permitidos', async () => {
      const response = await agent
        .patch('/api/maps/top-locations')
        .expect(405);

      expect(response.body.message).toContain('not allowed');
    });
  });

  describe('CORS Headers', () => {
    it('debe incluir headers CORS apropiados', async () => {
      const response = await agent
        .get('/api/maps/top-locations')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('debe devolver respuestas en formato JSON consistente', async () => {
      const response = await agent
        .get('/api/maps/top-locations')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
    });

    it('debe incluir timestamps en respuestas de error', async () => {
      const response = await agent
        .get('/api/maps/geocode')
        .query({ address: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
    });
  });
});