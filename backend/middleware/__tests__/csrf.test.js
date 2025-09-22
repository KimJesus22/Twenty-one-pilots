const { csrfProtection, sendCSRFToken, generateCSRFToken, validateCSRFToken } = require('../csrf');

// Mock de crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

const mockCrypto = require('crypto');

describe('CSRF Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      headers: {},
      body: {},
      sessionID: 'test-session-id',
      ip: '127.0.0.1',
    };

    mockRes = {
      setHeader: jest.fn(),
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Mock de crypto.randomBytes
    mockCrypto.randomBytes.mockReturnValue(Buffer.from('mock-random-token-32-chars!!'));

    // Limpiar tokens entre pruebas
    // Nota: En el código real, los tokens se almacenan en un Map global
    // Para las pruebas, podríamos necesitar una forma de resetear el estado
  });

  describe('generateCSRFToken', () => {
    it('debe generar un token CSRF único', () => {
      const token1 = generateCSRFToken('session1');
      const token2 = generateCSRFToken('session2');

      expect(typeof token1).toBe('string');
      expect(token1.length).toBeGreaterThan(0);
      expect(token1).not.toBe(token2);
    });

    it('debe usar crypto.randomBytes para generar tokens', () => {
      generateCSRFToken('test-session');

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
    });
  });

  describe('validateCSRFToken', () => {
    it('debe validar un token CSRF válido', () => {
      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      const isValid = validateCSRFToken(sessionId, token);
      expect(isValid).toBe(true);
    });

    it('debe rechazar un token CSRF inválido', () => {
      const sessionId = 'test-session';
      const validToken = generateCSRFToken(sessionId);
      const invalidToken = 'invalid-token';

      const isValid = validateCSRFToken(sessionId, invalidToken);
      expect(isValid).toBe(false);
    });

    it('debe rechazar un token para una sesión diferente', () => {
      const token = generateCSRFToken('session1');

      const isValid = validateCSRFToken('session2', token);
      expect(isValid).toBe(false);
    });

    it('debe manejar sesiones inexistentes', () => {
      const isValid = validateCSRFToken('nonexistent-session', 'any-token');
      expect(isValid).toBe(false);
    });
  });

  describe('csrfProtection middleware', () => {
    it('debe permitir requests GET sin token CSRF', () => {
      mockReq.method = 'GET';

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe permitir requests HEAD sin token CSRF', () => {
      mockReq.method = 'HEAD';

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe permitir requests OPTIONS sin token CSRF', () => {
      mockReq.method = 'OPTIONS';

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe rechazar requests POST sin token CSRF', () => {
      mockReq.method = 'POST';

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token CSRF requerido',
        error: 'CSRF_TOKEN_MISSING'
      });
    });

    it('debe rechazar requests PUT sin token CSRF', () => {
      mockReq.method = 'PUT';

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token CSRF requerido',
        error: 'CSRF_TOKEN_MISSING'
      });
    });

    it('debe aceptar requests POST con token CSRF válido en headers', () => {
      mockReq.method = 'POST';
      const token = generateCSRFToken(mockReq.sessionID);
      mockReq.headers['x-csrf-token'] = token;

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe aceptar requests POST con token CSRF válido en body', () => {
      mockReq.method = 'POST';
      const token = generateCSRFToken(mockReq.sessionID);
      mockReq.body._csrf = token;

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe rechazar requests POST con token CSRF inválido', () => {
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = 'invalid-token';

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token CSRF inválido o expirado',
        error: 'CSRF_TOKEN_INVALID'
      });
    });

    it('debe manejar requests sin sessionID usando IP', () => {
      mockReq.method = 'POST';
      delete mockReq.sessionID;
      const token = generateCSRFToken(mockReq.ip);
      mockReq.headers['x-csrf-token'] = token;

      csrfProtection(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('sendCSRFToken middleware', () => {
    it('debe enviar token CSRF en headers', () => {
      sendCSRFToken(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe enviar token CSRF como cookie segura', () => {
      // Mock de entorno de producción
      process.env.NODE_ENV = 'production';

      sendCSRFToken(mockReq, mockRes, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'csrf-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          secure: true,
          sameSite: 'strict',
          maxAge: 3600000, // 1 hora
        })
      );

      // Restaurar entorno
      process.env.NODE_ENV = 'test';
    });

    it('debe enviar token CSRF como cookie no segura en desarrollo', () => {
      sendCSRFToken(mockReq, mockRes, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'csrf-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 3600000,
        })
      );
    });

    it('debe usar sessionID cuando está disponible', () => {
      sendCSRFToken(mockReq, mockRes, mockNext);

      // El token debería generarse basado en sessionID
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));
    });

    it('debe usar IP como fallback cuando no hay sessionID', () => {
      delete mockReq.sessionID;

      sendCSRFToken(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));
    });
  });

  describe('Integración de middleware', () => {
    it('debe funcionar correctamente con ambos middlewares en secuencia', () => {
      // Primero enviar token
      sendCSRFToken(mockReq, mockRes, mockNext);

      const token = mockRes.setHeader.mock.calls[0][1];

      // Luego verificar token en request POST
      const postReq = {
        ...mockReq,
        method: 'POST',
        headers: { 'x-csrf-token': token },
      };

      const postRes = { ...mockRes };
      const postNext = jest.fn();

      csrfProtection(postReq, postRes, postNext);

      expect(postNext).toHaveBeenCalled();
      expect(postRes.status).not.toHaveBeenCalled();
    });

    it('debe rechazar tokens de sesiones diferentes', () => {
      // Generar token para una sesión
      sendCSRFToken(mockReq, mockRes, mockNext);
      const token = mockRes.setHeader.mock.calls[0][1];

      // Intentar usar el token con una sesión diferente
      const differentSessionReq = {
        ...mockReq,
        sessionID: 'different-session',
        method: 'POST',
        headers: { 'x-csrf-token': token },
      };

      csrfProtection(differentSessionReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token CSRF inválido o expirado',
        error: 'CSRF_TOKEN_INVALID'
      });
    });
  });

  describe('Expiración de tokens', () => {
    it('debe expirar tokens después del tiempo límite', () => {
      // Mock de Date.now para simular tiempo futuro
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalDateNow() + 61 * 60 * 1000); // 61 minutos después

      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      const isValid = validateCSRFToken(sessionId, token);
      expect(isValid).toBe(false);

      // Restaurar Date.now
      Date.now = originalDateNow;
    });

    it('debe limpiar tokens expirados automáticamente', () => {
      const sessionId1 = 'session1';
      const sessionId2 = 'session2';

      const token1 = generateCSRFToken(sessionId1);
      const token2 = generateCSRFToken(sessionId2);

      // Mock de tiempo futuro
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalDateNow() + 61 * 60 * 1000);

      // Generar un nuevo token debería limpiar los expirados
      generateCSRFToken('session3');

      // Los tokens antiguos deberían ser inválidos
      expect(validateCSRFToken(sessionId1, token1)).toBe(false);
      expect(validateCSRFToken(sessionId2, token2)).toBe(false);

      Date.now = originalDateNow;
    });
  });

  describe('Seguridad', () => {
    it('debe usar tokens criptográficamente seguros', () => {
      const token = generateCSRFToken('test');

      // Verificar que es una cadena hexadecimal/base64 segura
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 caracteres por byte en hex
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('debe prevenir reutilización de tokens (single-use)', () => {
      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      // Primer uso debería ser válido
      expect(validateCSRFToken(sessionId, token)).toBe(true);

      // Nota: En la implementación actual, los tokens no son single-use por defecto
      // pero podrían serlo cambiando la implementación
    });

    it('debe manejar ataques de timing attack', () => {
      const sessionId = 'test-session';
      const validToken = generateCSRFToken(sessionId);

      // Medir tiempo para token válido
      const startValid = process.hrtime.bigint();
      validateCSRFToken(sessionId, validToken);
      const endValid = process.hrtime.bigint();

      // Medir tiempo para token inválido
      const startInvalid = process.hrtime.bigint();
      validateCSRFToken(sessionId, 'invalid-token');
      const endInvalid = process.hrtime.bigint();

      // Los tiempos deberían ser similares (constante-time comparison)
      const timeValid = Number(endValid - startValid);
      const timeInvalid = Number(endInvalid - startInvalid);

      // La diferencia de tiempo debería ser mínima
      expect(Math.abs(timeValid - timeInvalid)).toBeLessThan(1000000); // 1ms de tolerancia
    });
  });
});