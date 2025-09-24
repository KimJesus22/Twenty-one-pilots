const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');
const twoFactorService = require('../services/twoFactorService');
const auditService = require('../services/auditService');
const { validationResult } = require('express-validator');

class AuthController {
  // Registro de usuario
  async register(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { username, email, password, recaptchaToken } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      // Validar reCAPTCHA
      try {
        await authService.validateRecaptchaForRegistration(recaptchaToken, ip, userAgent);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Usuario o email ya existe'
        });
      }

      // Crear nuevo usuario
      const user = new User({ username, email, password });
      await user.save();

      // Generar token
      const token = authService.generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token,
          user: {
            id: user._id,
            username,
            email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Login de usuario
  async login(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, recaptchaToken } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      // Validar reCAPTCHA
      try {
        await authService.validateRecaptchaForLogin(recaptchaToken, ip, userAgent);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Buscar usuario
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        await auditService.logLoginFailure(email, 'user_not_found', ip, userAgent);
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar si la cuenta está bloqueada
      if (user.isLocked) {
        await auditService.logLoginFailure(email, 'account_locked', ip, userAgent);
        return res.status(423).json({
          success: false,
          message: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos'
        });
      }

      // Verificar contraseña
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        // Incrementar contador de intentos fallidos
        await user.incLoginAttempts();
        await auditService.logLoginFailure(email, 'invalid_password', ip, userAgent);

        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Resetear intentos de login en caso de éxito
      await user.resetLoginAttempts();

      // Log successful login
      await auditService.logLoginSuccess(user._id, ip, userAgent);

      // Verificar si 2FA está habilitado
      if (user.twoFactorEnabled) {
        // Generar token temporal para verificación 2FA
        const tempToken = authService.generateTempToken(user._id);

        return res.json({
          success: true,
          message: 'Credenciales válidas, verificación 2FA requerida',
          data: {
            requiresTwoFactor: true,
            tempToken,
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          }
        });
      }

      // Generar token JWT completo
      const token = authService.generateToken(user._id);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener perfil de usuario
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password')
        .populate('playlists');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar perfil
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { username, email } = req.body;
      const userId = req.user.userId;

      // Verificar si el nuevo email/username ya existe
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          { $or: [{ email }, { username }] }
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email o username ya está en uso'
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, email },
        { new: true, select: '-password' }
      );

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar token
  async verifyToken(req, res) {
    try {
      // Si llega aquí, el token ya fue verificado por el middleware
      const user = await User.findById(req.user.userId).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const userId = req.user?.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      // Log logout event
      if (userId) {
        await auditService.logLogout(userId, ip, userAgent);
      }

      // En una implementación real, aquí podrías:
      // - Invalidar el token en una lista negra
      // - Limpiar sesiones activas

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 2FA: Generar secret y QR code
  async setupTwoFactor(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Generar secret y QR code
      const { secret, qrCode } = await twoFactorService.generateSecret(user.username);

      // Guardar secret temporalmente (no habilitado aún)
      user.twoFactorSecret = secret;
      await user.save();

      res.json({
        success: true,
        message: '2FA setup iniciado',
        data: {
          qrCode,
          secret
        }
      });
    } catch (error) {
      console.error('Error configurando 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 2FA: Verificar y habilitar
  async enableTwoFactor(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { token } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar token
      if (!twoFactorService.validateTokenFormat(token)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de token inválido'
        });
      }

      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Token 2FA inválido'
        });
      }

      // Habilitar 2FA y generar códigos de respaldo
      user.twoFactorEnabled = true;
      user.twoFactorBackupCodes = twoFactorService.generateBackupCodes();
      await user.save();

      // Log event
      await auditService.log2FAEnabled(userId, ip, userAgent);

      res.json({
        success: true,
        message: '2FA habilitado exitosamente',
        data: {
          backupCodes: user.twoFactorBackupCodes
        }
      });
    } catch (error) {
      console.error('Error habilitando 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 2FA: Deshabilitar
  async disableTwoFactor(req, res) {
    try {
      const userId = req.user.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      await user.save();

      // Log event
      await auditService.log2FADisabled(userId, ip, userAgent);

      res.json({
        success: true,
        message: '2FA deshabilitado exitosamente'
      });
    } catch (error) {
      console.error('Error deshabilitando 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 2FA: Verificar token (para login con 2FA)
  async verifyTwoFactor(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { tempToken, twoFactorToken, backupCode } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      // Verificar token temporal
      const decoded = authService.verifyTempToken(tempToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Token temporal inválido o expirado'
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: '2FA no está habilitado para este usuario'
        });
      }

      let isValid = false;

      if (twoFactorToken) {
        if (!twoFactorService.validateTokenFormat(twoFactorToken)) {
          await auditService.log2FAVerification(user._id, false, ip, userAgent);
          return res.status(400).json({
            success: false,
            message: 'Formato de token inválido'
          });
        }
        isValid = twoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken);
      } else if (backupCode) {
        isValid = twoFactorService.verifyBackupCode(user.twoFactorBackupCodes, backupCode);
        if (isValid) {
          await auditService.logBackupCodeUsed(user._id, ip, userAgent);
          await user.save();
        }
      }

      if (!isValid) {
        await auditService.log2FAVerification(user._id, false, ip, userAgent);
        return res.status(401).json({
          success: false,
          message: 'Token 2FA o código de respaldo inválido'
        });
      }

      // Log successful verification
      await auditService.log2FAVerification(user._id, true, ip, userAgent);

      // Generar token JWT completo
      const token = authService.generateToken(user._id);

      res.json({
        success: true,
        message: '2FA verificado exitosamente',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled
          }
        }
      });
    } catch (error) {
      console.error('Error verificando 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 2FA: Regenerar códigos de respaldo
  async regenerateBackupCodes(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: '2FA no está habilitado'
        });
      }

      user.twoFactorBackupCodes = twoFactorService.generateBackupCodes();
      await user.save();

      res.json({
        success: true,
        message: 'Códigos de respaldo regenerados',
        data: {
          backupCodes: user.twoFactorBackupCodes
        }
      });
    } catch (error) {
      console.error('Error regenerando códigos de respaldo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener configuración de reCAPTCHA para frontend
  async getRecaptchaConfig(req, res) {
    try {
      const config = authService.getRecaptchaConfig();

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Error obteniendo configuración reCAPTCHA:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new AuthController();