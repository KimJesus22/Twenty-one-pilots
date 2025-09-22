/**
 * Utilidades de cifrado para datos sensibles en localStorage
 * Usa Web Crypto API con AES-GCM y claves derivadas de PBKDF2
 */

const ENCRYPTION_KEY = 'twentyonepilots_app_key';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ITERATIONS = 100000;

/**
 * Deriva una clave criptográfica desde una contraseña usando PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Genera un salt aleatorio
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Genera un IV aleatorio
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Cifra datos sensibles antes de almacenarlos en localStorage
 */
export async function encryptData(data) {
  try {
    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(ENCRYPTION_KEY, salt);

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Combinar salt + iv + datos cifrados
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convertir a base64 para almacenamiento
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Descifra datos desde localStorage
 */
export async function decryptData(encryptedData) {
  try {
    // Convertir de base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    // Extraer salt, iv y datos cifrados
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(ENCRYPTION_KEY, salt);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Almacena datos cifrados en localStorage
 */
export async function setEncryptedItem(key, data) {
  try {
    const encrypted = await encryptData(data);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Error storing encrypted data:', error);
    throw error;
  }
}

/**
 * Recupera datos descifrados desde localStorage
 */
export async function getEncryptedItem(key) {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    return await decryptData(encrypted);
  } catch (error) {
    console.error('Error retrieving encrypted data:', error);
    // Si hay error de descifrado, limpiar el dato corrupto
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Elimina datos cifrados de localStorage
 */
export function removeEncryptedItem(key) {
  localStorage.removeItem(key);
}

/**
 * Verifica si la Web Crypto API está disponible
 */
export function isCryptoAvailable() {
  return !!(crypto && crypto.subtle && crypto.getRandomValues);
}

/**
 * Genera un hash seguro para datos (no reversible)
 */
export async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un token aleatorio seguro
 */
export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default {
  encryptData,
  decryptData,
  setEncryptedItem,
  getEncryptedItem,
  removeEncryptedItem,
  isCryptoAvailable,
  hashData,
  generateSecureToken,
};