const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Configurar base de datos en memoria para tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Limpiar base de datos entre tests
afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cerrar conexiones después de todos los tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.MONGO_URI = 'mongodb://localhost:27017/twentyonepilots_test';

// Mock de servicios externos
jest.mock('../services/notificationService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendConcertNotification: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  clearPattern: jest.fn(),
  getOrSet: jest.fn(),
  isAvailable: jest.fn().mockReturnValue(false)
}));

// Mock de axios para APIs externas
jest.mock('axios');
const axios = require('axios');

// Mock responses para YouTube API
axios.get.mockImplementation((url) => {
  if (url.includes('youtube')) {
    return Promise.resolve({
      data: {
        items: [
          {
            id: { videoId: 'test_video_id' },
            snippet: {
              title: 'Test Video',
              description: 'Test description',
              thumbnails: { default: { url: 'test_thumbnail.jpg' } }
            }
          }
        ]
      }
    });
  }

  // Mock responses para Eventbrite API
  if (url.includes('eventbrite')) {
    return Promise.resolve({
      data: {
        events: [
          {
            id: 'test_event_id',
            name: { text: 'Test Concert' },
            venue_name: 'Test Venue',
            start_date: '2024-12-31T20:00:00Z'
          }
        ]
      }
    });
  }

  return Promise.reject(new Error('URL not mocked'));
});

// Helper functions para tests
global.createTestUser = async (User, userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    ...userData
  };

  const user = new User(defaultUser);
  await user.save();
  return user;
};

global.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

global.testUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

global.testAlbumData = {
  title: 'Test Album',
  releaseYear: 2023,
  coverImage: 'test_cover.jpg'
};

global.testSongData = {
  title: 'Test Song',
  lyrics: 'Test lyrics content',
  duration: '3:45'
};