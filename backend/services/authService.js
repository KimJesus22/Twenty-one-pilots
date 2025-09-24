const jwt = require('jsonwebtoken');
const User = require('../models/User');
const recaptchaService = require('./recaptchaService');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // Generar token JWT
  generateToken(userId) {
    try {
      return jwt.sign(
        { userId },
        this.jwtSecret,
        { expiresIn: this.jwtExpiresIn }
      );
    } catch (error) {
      logger.error('Error generando token JWT:', error);
      throw new Error('Error generando token de autenticación');
    }
  }

  // Verificar token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('Error verificando token JWT:', error);
      throw new Error('Token inválido o expirado');
    }
  }

  // Decodificar token sin verificar (para obtener información básica)
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decodificando token JWT:', error);
      return null;
    }
  }

  // Generar token de refresco
  generateRefreshToken(userId) {
    try {
      return jwt.sign(
        { userId, type: 'refresh' },
        this.jwtSecret,
        { expiresIn: '30d' }
      );
    } catch (error) {
      logger.error('Error generando token de refresco:', error);
      throw new Error('Error generando token de refresco');
    }
  }

  // Generar token temporal para 2FA (5 minutos)
  generateTempToken(userId) {
    try {
      return jwt.sign(
        { userId, type: 'temp-2fa' },
        this.jwtSecret,
        { expiresIn: '5m' }
      );
    } catch (error) {
      logger.error('Error generando token temporal 2FA:', error);
      throw new Error('Error generando token temporal');
    }
  }

  // Verificar token temporal para 2FA
  verifyTempToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'temp-2fa') {
        throw new Error('Tipo de token inválido');
      }
      return decoded;
    } catch (error) {
      logger.error('Error verificando token temporal 2FA:', error);
      return null;
    }
  }

  // Validar credenciales de usuario
  async validateCredentials(email, password) {
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return { isValid: false, user: null };
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return { isValid: false, user: null };
      }

      return { isValid: true, user };
    } catch (error) {
      logger.error('Error validando credenciales:', error);
      throw new Error('Error validando credenciales');
    }
  }

  // Obtener usuario por ID (sin contraseña)
  async getUserById(userId) {
    try {
      return await User.findById(userId).select('-password');
    } catch (error) {
      logger.error('Error obteniendo usuario por ID:', error);
      throw new Error('Usuario no encontrado');
    }
  }

  // Verificar si el usuario tiene permisos de administrador
  async isAdmin(userId) {
    try {
      const user = await User.findById(userId);
      return user && user.role === 'admin';
    } catch (error) {
      logger.error('Error verificando permisos de admin:', error);
      return false;
    }
  }

  // Generar token temporal para recuperación de contraseña
  generatePasswordResetToken(userId) {
    try {
      return jwt.sign(
        { userId, type: 'password-reset' },
        this.jwtSecret,
        { expiresIn: '1h' }
      );
    } catch (error) {
      logger.error('Error generando token de recuperación:', error);
      throw new Error('Error generando token de recuperación');
    }
  }

  // Verificar token de recuperación de contraseña
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'password-reset') {
        throw new Error('Tipo de token inválido');
      }
      return decoded;
    } catch (error) {
      logger.error('Error verificando token de recuperación:', error);
      throw new Error('Token de recuperación inválido o expirado');
    }
  }

  // Middleware para verificar autenticación
  authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticación requerido'
        });
      }

      const decoded = this.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Error en middleware de autenticación:', error);
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  }

  // Middleware para verificar permisos de administrador
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permisos de administrador requeridos'
      });
    }

    next();
  }

  // Middleware para verificar permisos de moderador
  requireModerator(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Permisos de moderador requeridos'
      });
    }

    next();
  }

  // Validar reCAPTCHA para registro
  async validateRecaptchaForRegistration(recaptchaToken, ip, userAgent) {
    const result = await recaptchaService.verifyToken(
      recaptchaToken,
      'register',
      ip,
      userAgent
    );

    if (!result.success) {
      throw new Error(result.error || 'Validación reCAPTCHA fallida');
    }

    return result;
  }

  // Validar reCAPTCHA para login
  async validateRecaptchaForLogin(recaptchaToken, ip, userAgent) {
    const result = await recaptchaService.verifyToken(
      recaptchaToken,
      'login',
      ip,
      userAgent
    );

    if (!result.success) {
      throw new Error(result.error || 'Validación reCAPTCHA fallida');
    }

    return result;
  }

  // Validar reCAPTCHA para creación de hilos (forum)
  async validateRecaptchaForThreadCreation(recaptchaToken, ip, userAgent) {
    const result = await recaptchaService.verifyToken(
      recaptchaToken,
      'create_thread',
      ip,
      userAgent
    );

    if (!result.success) {
      throw new Error(result.error || 'Validación reCAPTCHA fallida');
    }

    return result;
  }

  // Obtener configuración de reCAPTCHA para frontend
  getRecaptchaConfig() {
    return {
      siteKey: recaptchaService.getSiteKey(),
      enabled: !!recaptchaService.getSiteKey(),
      minimumScore: recaptchaService.minimumScore
    };
  }

  // Limpiar tokens expirados (útil para mantenimiento)
  async cleanupExpiredTokens() {
    try {
      // Esta función podría limpiar tokens expirados de una base de datos
      // Por ahora solo registra la actividad
      logger.info('Limpieza de tokens expirados completada');
    } catch (error) {
      logger.error('Error limpiando tokens expirados:', error);
    }
  }
}

module.exports = new AuthService();