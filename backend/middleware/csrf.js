const crypto = require('crypto');

/**
 * Middleware para protección CSRF (Cross-Site Request Forgery)
 * Genera y valida tokens CSRF para prevenir ataques CSRF
 */

// Almacén temporal de tokens CSRF (en producción usar Redis)
const csrfTokens = new Map();

// Generar token CSRF
function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + (60 * 60 * 1000); // 1 hora

  csrfTokens.set(sessionId, { token, expiry });

  // Limpiar tokens expirados
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiry < Date.now()) {
      csrfTokens.delete(key);
    }
  }

  return token;
}

// Validar token CSRF
function validateCSRFToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  if (stored.expiry < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  if (stored.token !== token) {
    return false;
  }

  // Token usado una vez (opcional - para mayor seguridad)
  // csrfTokens.delete(sessionId);

  return true;
}

// Middleware para generar token CSRF
function csrfProtection(req, res, next) {
  // Solo aplicar a rutas que modifican datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const sessionId = req.sessionID || req.ip || 'anonymous';

    // Verificar token CSRF
    const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

    if (!token) {
      return res.status(403).json({
        success: false,
        message: 'Token CSRF requerido',
        error: 'CSRF_TOKEN_MISSING'
      });
    }

    if (!validateCSRFToken(sessionId, token)) {
      return res.status(403).json({
        success: false,
        message: 'Token CSRF inválido o expirado',
        error: 'CSRF_TOKEN_INVALID'
      });
    }
  }

  next();
}

// Middleware para enviar token CSRF al cliente
function sendCSRFToken(req, res, next) {
  const sessionId = req.sessionID || req.ip || 'anonymous';
  const token = generateCSRFToken(sessionId);

  // Enviar token en headers y cookies
  res.setHeader('X-CSRF-Token', token);

  // Cookie segura (solo HTTPS en producción)
  res.cookie('csrf-token', token, {
    httpOnly: false, // Necesario para que JS pueda leerlo
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hora
  });

  next();
}

// Función para obtener token CSRF (para uso en rutas)
function getCSRFToken(req) {
  const sessionId = req.sessionID || req.ip || 'anonymous';
  return generateCSRFToken(sessionId);
}

module.exports = {
  csrfProtection,
  sendCSRFToken,
  getCSRFToken,
  generateCSRFToken,
  validateCSRFToken
};