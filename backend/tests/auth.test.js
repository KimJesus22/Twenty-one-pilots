const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

// Crear app de test
const app = express();
app.use(express.json());

// Importar rutas
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

// Mock de servicios
jest.mock('../services/notificationService');

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Conectar a base de datos de test
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
    // Limpiar colección de usuarios
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return error for duplicate email', async () => {
      // Crear usuario primero
      await User.create({
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123'
      });

      const userData = {
        username: 'newuser',
        email: 'test@example.com', // Email duplicado
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toMatch(/ya existe/i);
    });

    it('should return error for duplicate username', async () => {
      // Crear usuario primero
      await User.create({
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123'
      });

      const userData = {
        username: 'testuser', // Username duplicado
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toMatch(/ya existe/i);
    });

    it('should return error for missing required fields', async () => {
      const incompleteData = {
        username: 'testuser'
        // Falta email y password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(500); // Error de validación de Mongoose

      expect(response.body.error).toBeDefined();
    });

    it('should return error for invalid email format', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(500); // Error de validación de Mongoose

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario para tests de login
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      await user.save();
    });

    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toMatch(/credenciales inválidas/i);
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toMatch(/credenciales inválidas/i);
    });

    it('should return error for missing fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Falta password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(incompleteData)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});