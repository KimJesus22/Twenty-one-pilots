const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { Album, Song } = require('../models/Discography');

// Crear app de test
const app = express();
app.use(express.json());

// Importar rutas
const discographyRoutes = require('../routes/discography');
app.use('/api/discography', discographyRoutes);

// Mock del middleware de caché
jest.mock('../middleware/cache', () => ({
  cachePublic: () => (req, res, next) => next(),
  invalidateCache: () => (req, res, next) => next()
}));

// Mock del middleware de paginación
jest.mock('../middleware/pagination', () => ({
  paginate: () => (req, res, next) => {
    req.pagination = {
      page: 1,
      limit: 10,
      skip: 0
    };
    next();
  },
  sendPaginatedResponse: () => async (req, res) => {
    const Model = req.model;
    const { skip, limit } = req.pagination;

    const query = Model.find(req.query || {});
    if (req.populate) {
      req.populate.forEach(pop => query.populate(pop));
    }

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).sort(req.sort || {}),
      Model.countDocuments(req.query || {})
    ]);

    res.json({
      data,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }
}));

describe('Discography Routes', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/twentyonepilots_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Album.deleteMany({});
    await Song.deleteMany({});
  });

  describe('GET /api/discography/albums', () => {
    it('should return empty array when no albums exist', async () => {
      const response = await request(app)
        .get('/api/discography/albums')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual([]);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return albums with pagination', async () => {
      // Crear álbumes de prueba
      const albums = [
        { title: 'Album 1', releaseYear: 2020 },
        { title: 'Album 2', releaseYear: 2021 },
        { title: 'Album 3', releaseYear: 2022 }
      ];

      await Album.insertMany(albums);

      const response = await request(app)
        .get('/api/discography/albums')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('releaseYear');
      expect(response.body.pagination.total).toBe(3);
    });

    it('should support sorting by release year', async () => {
      const albums = [
        { title: 'Old Album', releaseYear: 2019 },
        { title: 'New Album', releaseYear: 2023 }
      ];

      await Album.insertMany(albums);

      const response = await request(app)
        .get('/api/discography/albums?sort=releaseYear:desc')
        .expect(200);

      expect(response.body.data[0].releaseYear).toBe(2023);
      expect(response.body.data[1].releaseYear).toBe(2019);
    });
  });

  describe('GET /api/discography/albums/:id', () => {
    it('should return album by id', async () => {
      const album = await Album.create({
        title: 'Test Album',
        releaseYear: 2023,
        coverImage: 'test.jpg'
      });

      const response = await request(app)
        .get(`/api/discography/albums/${album._id}`)
        .expect(200);

      expect(response.body.title).toBe('Test Album');
      expect(response.body.releaseYear).toBe(2023);
    });

    it('should return 404 for non-existent album', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/discography/albums/${fakeId}`)
        .expect(404);

      expect(response.body.error).toMatch(/no encontrado/i);
    });

    it('should return 500 for invalid object id', async () => {
      const response = await request(app)
        .get('/api/discography/albums/invalid-id')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/discography/songs', () => {
    it('should return all songs', async () => {
      const album = await Album.create({ title: 'Test Album', releaseYear: 2023 });

      const songs = [
        { title: 'Song 1', album: album._id },
        { title: 'Song 2', album: album._id }
      ];

      await Song.insertMany(songs);

      const response = await request(app)
        .get('/api/discography/songs')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('album');
    });

    it('should populate album data', async () => {
      const album = await Album.create({ title: 'Test Album', releaseYear: 2023 });
      const song = await Song.create({ title: 'Test Song', album: album._id });

      const response = await request(app)
        .get('/api/discography/songs')
        .expect(200);

      expect(response.body[0].album).toHaveProperty('title', 'Test Album');
      expect(response.body[0].album).toHaveProperty('releaseYear', 2023);
    });
  });

  describe('GET /api/discography/songs/:id', () => {
    it('should return song by id', async () => {
      const album = await Album.create({ title: 'Test Album', releaseYear: 2023 });
      const song = await Song.create({
        title: 'Test Song',
        lyrics: 'Test lyrics',
        album: album._id
      });

      const response = await request(app)
        .get(`/api/discography/songs/${song._id}`)
        .expect(200);

      expect(response.body.title).toBe('Test Song');
      expect(response.body.lyrics).toBe('Test lyrics');
      expect(response.body.album.title).toBe('Test Album');
    });

    it('should return 404 for non-existent song', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/discography/songs/${fakeId}`)
        .expect(404);

      expect(response.body.error).toMatch(/no encontrada/i);
    });
  });
});