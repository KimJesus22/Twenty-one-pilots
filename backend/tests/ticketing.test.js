const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ticketingService = require('../services/ticketingService');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

let mongoServer;

describe('Ticketing Service', () => {
  beforeAll(async () => {
    // Configurar MongoDB en memoria para pruebas
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await Event.deleteMany({});
    await Ticket.deleteMany({});
    await User.deleteMany({});
  });

  describe('Event Model Extensions', () => {
    test('should check if ticketing is enabled', async () => {
      const event = new Event({
        title: 'Test Event',
        date: new Date(),
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' },
        ticketing: { enabled: true }
      });

      expect(event.isTicketingEnabled()).toBe(true);

      event.ticketing.enabled = false;
      expect(event.isTicketingEnabled()).toBe(false);
    });

    test('should get available tickets', async () => {
      const event = new Event({
        title: 'Test Event',
        date: new Date(),
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' },
        ticketing: {
          enabled: true,
          ticketTypes: [
            { id: 'vip', name: 'VIP', quantity: 100, sold: 20 },
            { id: 'general', name: 'General', quantity: 200, sold: 50 }
          ]
        }
      });

      const available = event.getAvailableTickets();
      expect(available).toHaveLength(2);
      expect(available[0].available).toBe(80); // 100 - 20
      expect(available[1].available).toBe(150); // 200 - 50
    });

    test('should check ticket availability', async () => {
      const event = new Event({
        title: 'Test Event',
        date: new Date(),
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' },
        ticketing: {
          enabled: true,
          ticketTypes: [
            { id: 'vip', name: 'VIP', quantity: 100, sold: 20 }
          ]
        }
      });

      expect(event.checkTicketAvailability('vip', 50)).toBe(true);
      expect(event.checkTicketAvailability('vip', 100)).toBe(false);
    });
  });

  describe('Ticket Model', () => {
    test('should create ticket with QR code', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const event = await Event.create({
        title: 'Test Event',
        date: new Date(),
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' }
      });

      const ticket = new Ticket({
        event: event._id,
        user: user._id,
        seat: { section: 'A', row: '1', seat: '1' },
        price: { amount: 100, currency: 'MXN' }
      });

      expect(ticket.qrCode).toBeDefined();
      expect(ticket.validationCode).toBeDefined();
      expect(ticket.ticketNumber).toBeDefined();
    });

    test('should check if ticket can be refunded', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 días en el futuro

      const event = await Event.create({
        title: 'Future Event',
        date: futureDate,
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' },
        ticketing: {
          refundPolicy: { allowed: true, deadlineHours: 24 }
        }
      });

      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const ticket = await Ticket.create({
        event: event._id,
        user: user._id,
        seat: { section: 'A', row: '1', seat: '1' },
        price: { amount: 100, currency: 'MXN' },
        status: 'confirmed'
      });

      expect(ticket.canRefund).toBe(true);
    });

    test('should validate ticket', async () => {
      const event = await Event.create({
        title: 'Test Event',
        date: new Date(),
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' }
      });

      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const ticket = await Ticket.create({
        event: event._id,
        user: user._id,
        seat: { section: 'A', row: '1', seat: '1' },
        price: { amount: 100, currency: 'MXN' },
        status: 'delivered'
      });

      const result = await ticket.validateTicket();
      expect(result).toBe(true);
      expect(ticket.status).toBe('used');
      expect(ticket.accessCount).toBe(1);
    });
  });

  describe('Ticketing Service', () => {
    test('should get seat availability', async () => {
      const event = await Event.create({
        title: 'Test Event',
        date: new Date(),
        venue: {
          name: 'Test Venue',
          address: 'Test Address',
          city: 'Test City',
          country: 'Test Country',
          layout: {
            sections: [
              { id: 'A', name: 'Sección A', capacity: 100, type: 'seated' },
              { id: 'B', name: 'Sección B', capacity: 100, type: 'seated' }
            ]
          }
        },
        ticketing: { enabled: true }
      });

      const result = await ticketingService.getSeatAvailability(event._id);
      expect(result.success).toBe(true);
      expect(result.data.sections).toHaveLength(2);
      expect(result.data.totalAvailable).toBe(200);
    });

    test('should reserve seats', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const event = await Event.create({
        title: 'Test Event',
        date: new Date(),
        venue: {
          name: 'Test Venue',
          address: 'Test Address',
          city: 'Test City',
          country: 'Test Country',
          layout: {
            sections: [
              { id: 'A', name: 'Sección A', capacity: 100, type: 'seated' }
            ]
          }
        },
        ticketing: { enabled: true }
      });

      const seatsToReserve = [
        { section: 'A', row: '1', seat: '1' },
        { section: 'A', row: '1', seat: '2' }
      ];

      const result = await ticketingService.reserveSeats(event._id, seatsToReserve, user._id);
      expect(result.success).toBe(true);
      expect(result.data.tickets).toHaveLength(2);
      expect(result.data.totalAmount).toBeGreaterThan(0);
    });

    test('should validate ticket by number', async () => {
      const event = await Event.create({
        title: 'Test Event',
        date: new Date(),
        venue: { name: 'Test Venue', address: 'Test Address', city: 'Test City', country: 'Test Country' }
      });

      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const ticket = await Ticket.create({
        event: event._id,
        user: user._id,
        seat: { section: 'A', row: '1', seat: '1' },
        price: { amount: 100, currency: 'MXN' },
        status: 'delivered'
      });

      const result = await ticketingService.validateTicket(ticket.ticketNumber, event._id);
      expect(result.success).toBe(true);
      expect(result.data.validatedAt).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should complete full ticketing flow', async () => {
      // Crear usuario
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      // Crear evento con ticketing
      const event = await Event.create({
        title: 'Concierto de Prueba',
        artist: 'Artista de Prueba',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días en el futuro
        venue: {
          name: 'Auditorio Nacional',
          address: 'Paseo de la Reforma 50',
          city: 'Ciudad de México',
          state: 'CDMX',
          country: 'México',
          coordinates: { latitude: 19.4326, longitude: -99.1332 },
          layout: {
            sections: [
              {
                id: 'VIP',
                name: 'VIP',
                type: 'seated',
                capacity: 50,
                price: { min: 500, max: 500, currency: 'MXN' }
              },
              {
                id: 'GENERAL',
                name: 'General',
                type: 'seated',
                capacity: 200,
                price: { min: 200, max: 200, currency: 'MXN' }
              }
            ]
          }
        },
        ticketing: {
          enabled: true,
          provider: 'internal',
          ticketTypes: [
            {
              id: 'vip',
              name: 'VIP',
              quantity: 50,
              sold: 0,
              price: { amount: 500, currency: 'MXN' },
              maxPerOrder: 4,
              isActive: true
            },
            {
              id: 'general',
              name: 'General',
              quantity: 200,
              sold: 0,
              price: { amount: 200, currency: 'MXN' },
              maxPerOrder: 6,
              isActive: true
            }
          ],
          refundPolicy: {
            allowed: true,
            deadlineHours: 24,
            fee: 50
          }
        }
      });

      // 1. Verificar disponibilidad de asientos
      const availability = await ticketingService.getSeatAvailability(event._id);
      expect(availability.success).toBe(true);
      expect(availability.data.totalAvailable).toBe(250);

      // 2. Reservar asientos
      const seatsToReserve = [
        { section: 'VIP', row: '1', seat: '1' },
        { section: 'VIP', row: '1', seat: '2' }
      ];

      const reservation = await ticketingService.reserveSeats(event._id, seatsToReserve, user._id);
      expect(reservation.success).toBe(true);
      expect(reservation.data.tickets).toHaveLength(2);

      // 3. Verificar que los asientos ya no están disponibles
      const availabilityAfter = await ticketingService.getSeatAvailability(event._id);
      expect(availabilityAfter.data.occupiedSeats).toHaveLength(2);

      // 4. Validar integración completa
      expect(event.isTicketingEnabled()).toBe(true);
      expect(event.getAvailableTickets()).toHaveLength(2);
    });
  });
});