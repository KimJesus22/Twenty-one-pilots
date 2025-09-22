import {
  encryptData,
  decryptData,
  setEncryptedItem,
  getEncryptedItem,
  removeEncryptedItem,
  isCryptoAvailable,
  hashData,
  generateSecureToken
} from '../encryption';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock de crypto
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
      deriveKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      digest: jest.fn(),
    },
    getRandomValues: jest.fn(),
  },
  writable: true,
});

describe('Encryption Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock de crypto.getRandomValues
    crypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });

    // Mock de crypto.subtle.importKey
    crypto.subtle.importKey.mockResolvedValue('mock-key-material');

    // Mock de crypto.subtle.deriveKey
    crypto.subtle.deriveKey.mockResolvedValue('mock-derived-key');

    // Mock de crypto.subtle.encrypt
    crypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5]));

    // Mock de crypto.subtle.decrypt
    crypto.subtle.decrypt.mockResolvedValue(new Uint8Array([72, 101, 108, 108, 111])); // "Hello"

    // Mock de crypto.subtle.digest
    crypto.subtle.digest.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  });

  describe('isCryptoAvailable', () => {
    it('debe devolver true cuando Web Crypto API está disponible', () => {
      expect(isCryptoAvailable()).toBe(true);
    });

    it('debe devolver false cuando crypto no está disponible', () => {
      const originalCrypto = window.crypto;
      delete window.crypto;

      expect(isCryptoAvailable()).toBe(false);

      window.crypto = originalCrypto;
    });

    it('debe devolver false cuando crypto.subtle no está disponible', () => {
      const originalSubtle = window.crypto.subtle;
      delete window.crypto.subtle;

      expect(isCryptoAvailable()).toBe(false);

      window.crypto.subtle = originalSubtle;
    });
  });

  describe('encryptData/decryptData', () => {
    it('debe cifrar y descifrar datos correctamente', async () => {
      const testData = { message: 'Hello World', userId: '123' };

      const encrypted = await encryptData(testData);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = await decryptData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('debe manejar errores de cifrado', async () => {
      crypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'));

      await expect(encryptData('test')).rejects.toThrow('Failed to encrypt data');
    });

    it('debe manejar errores de descifrado', async () => {
      crypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(decryptData('invalid')).rejects.toThrow('Failed to decrypt data');
    });

    it('debe manejar datos de descifrado inválidos', async () => {
      await expect(decryptData('invalid-base64')).rejects.toThrow('Failed to decrypt data');
    });
  });

  describe('setEncryptedItem/getEncryptedItem/removeEncryptedItem', () => {
    it('debe almacenar y recuperar datos cifrados', async () => {
      const testData = { token: 'abc123', expires: Date.now() };

      await setEncryptedItem('test-key', testData);

      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', expect.any(String));

      localStorage.getItem.mockReturnValue(localStorage.setItem.mock.calls[0][1]);

      const retrieved = await getEncryptedItem('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('debe devolver null para claves inexistentes', async () => {
      localStorage.getItem.mockReturnValue(null);

      const result = await getEncryptedItem('nonexistent-key');
      expect(result).toBeNull();
    });

    it('debe manejar errores de descifrado al recuperar datos', async () => {
      localStorage.getItem.mockReturnValue('corrupted-data');
      crypto.subtle.decrypt.mockRejectedValue(new Error('Corrupted'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const removeSpy = jest.spyOn(localStorage, 'removeItem');

      const result = await getEncryptedItem('test-key');

      expect(result).toBeNull();
      expect(removeSpy).toHaveBeenCalledWith('test-key');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('debe eliminar datos cifrados', () => {
      removeEncryptedItem('test-key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('hashData', () => {
    it('debe crear un hash seguro de los datos', async () => {
      const testData = 'password123';
      const hash = await hashData(testData);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('debe crear hashes consistentes para los mismos datos', async () => {
      const testData = 'consistent-data';
      const hash1 = await hashData(testData);
      const hash2 = await hashData(testData);

      expect(hash1).toBe(hash2);
    });

    it('debe crear hashes diferentes para datos diferentes', async () => {
      const hash1 = await hashData('data1');
      const hash2 = await hashData('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSecureToken', () => {
    it('debe generar tokens seguros de la longitud especificada', () => {
      const token = generateSecureToken(16);

      expect(typeof token).toBe('string');
      expect(token.length).toBe(32); // 16 bytes * 2 hex chars
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('debe generar tokens únicos', () => {
      const token1 = generateSecureToken(8);
      const token2 = generateSecureToken(8);

      expect(token1).not.toBe(token2);
    });

    it('debe usar crypto.getRandomValues para generar aleatoriedad', () => {
      generateSecureToken(4);

      expect(crypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('Integración con localStorage', () => {
    it('debe manejar datos complejos correctamente', async () => {
      const complexData = {
        user: {
          id: '123',
          email: 'test@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
            language: 'es'
          }
        },
        session: {
          token: 'jwt-token-here',
          expires: Date.now() + 3600000,
          refreshToken: 'refresh-token-here'
        },
        metadata: {
          loginTime: new Date().toISOString(),
          deviceId: 'device-123',
          ip: '192.168.1.1'
        }
      };

      await setEncryptedItem('complex-data', complexData);

      localStorage.getItem.mockReturnValue(localStorage.setItem.mock.calls[0][1]);

      const retrieved = await getEncryptedItem('complex-data');
      expect(retrieved).toEqual(complexData);
    });

    it('debe limpiar datos corruptos automáticamente', async () => {
      // Simular datos corruptos en localStorage
      localStorage.getItem.mockReturnValue('corrupted-encrypted-data');
      crypto.subtle.decrypt.mockRejectedValue(new Error('Corruption detected'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getEncryptedItem('corrupted-key');

      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('corrupted-key');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error retrieving encrypted data:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Seguridad criptográfica', () => {
    it('debe usar parámetros criptográficos seguros', async () => {
      await encryptData('test');

      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 100000, // Debe ser alto para seguridad
          hash: 'SHA-256',
        }),
        'mock-key-material',
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });

    it('debe usar AES-GCM para cifrado simétrico', async () => {
      await encryptData('test');

      expect(crypto.subtle.encrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(Uint8Array),
        },
        'mock-derived-key',
        expect.any(Uint8Array)
      );
    });

    it('debe generar IVs únicos para cada cifrado', async () => {
      await encryptData('test1');
      await encryptData('test2');

      const calls = crypto.subtle.encrypt.mock.calls;
      expect(calls[0][0].iv).not.toEqual(calls[1][0].iv);
    });
  });
});