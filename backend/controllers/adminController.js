const User = require('../models/User');
const auditService = require('../services/auditService');
const { validationResult } = require('express-validator');

class AdminController {
  // Obtener todos los usuarios (solo admin)
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find({})
        .select('-password -twoFactorSecret -twoFactorBackupCodes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener usuario por ID
  async getUserById(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password -twoFactorSecret -twoFactorBackupCodes');

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
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar rol de usuario
  async changeUserRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { role } = req.body;
      const adminId = req.user.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const oldRole = user.role;
      user.role = role;
      await user.save();

      // Log role change
      await auditService.logRoleChanged(adminId, userId, oldRole, role, ip, userAgent);

      res.json({
        success: true,
        message: `Rol de usuario cambiado a ${role}`,
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
      console.error('Error cambiando rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Otorgar permiso específico
  async grantPermission(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { resource, action } = req.body;
      const adminId = req.user.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      user.grantPermission(resource, action);
      await user.save();

      // Log permission grant
      await auditService.logPermissionGranted(adminId, userId, resource, action, ip, userAgent);

      res.json({
        success: true,
        message: `Permiso ${action} otorgado para ${resource}`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            permissions: user.permissions
          }
        }
      });
    } catch (error) {
      console.error('Error otorgando permiso:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Revocar permiso específico
  async revokePermission(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { resource, action } = req.body;
      const adminId = req.user.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      user.revokePermission(resource, action);
      await user.save();

      // Log permission revoke
      await auditService.logPermissionRevoked(adminId, userId, resource, action, ip, userAgent);

      res.json({
        success: true,
        message: `Permiso ${action} revocado para ${resource}`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            permissions: user.permissions
          }
        }
      });
    } catch (error) {
      console.error('Error revocando permiso:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Bloquear/desbloquear usuario
  async toggleUserLock(req, res) {
    try {
      const { userId } = req.params;
      const { lock } = req.body; // boolean
      const adminId = req.user.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (lock) {
        user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await auditService.logAccountLocked(adminId, 'admin_action', ip, userAgent);
      } else {
        user.lockUntil = undefined;
        user.loginAttempts = 0;
        await auditService.logAccountUnlocked(adminId, ip, userAgent);
      }

      await user.save();

      res.json({
        success: true,
        message: `Usuario ${lock ? 'bloqueado' : 'desbloqueado'} exitosamente`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            isLocked: user.isLocked
          }
        }
      });
    } catch (error) {
      console.error('Error cambiando estado de bloqueo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar usuario
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.userId;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir eliminar al propio usuario
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }

      await User.findByIdAndDelete(userId);

      // Log user deletion
      await auditService.logUserDeleted(adminId, userId, ip, userAgent);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener logs de auditoría
  async getAuditLogs(req, res) {
    try {
      const { event, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (event) filters.event = event;
      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const logs = await auditService.getAuditLogs(filters);

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = logs.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          logs: paginatedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: logs.length,
            pages: Math.ceil(logs.length / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo logs de auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de seguridad
  async getSecurityStats(req, res) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        lockedUsers,
        twoFactorUsers,
        recentFailedLogins,
        recentSuccessfulLogins
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lockUntil: { $gt: new Date() } }),
        User.countDocuments({ twoFactorEnabled: true }),
        auditService.getAuditLogs({
          event: 'LOGIN_FAILURE',
          startDate: thirtyDaysAgo.toISOString()
        }),
        auditService.getAuditLogs({
          event: 'LOGIN_SUCCESS',
          startDate: thirtyDaysAgo.toISOString()
        })
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          lockedUsers,
          twoFactorUsers,
          twoFactorPercentage: totalUsers > 0 ? (twoFactorUsers / totalUsers * 100).toFixed(1) : 0,
          recentFailedLogins: recentFailedLogins.length,
          recentSuccessfulLogins: recentSuccessfulLogins.length,
          securityScore: this.calculateSecurityScore({
            totalUsers,
            lockedUsers,
            twoFactorUsers,
            recentFailedLogins: recentFailedLogins.length
          })
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de seguridad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Calcular puntuación de seguridad
  calculateSecurityScore(stats) {
    let score = 0;

    // 2FA adoption (40% weight)
    const twoFactorScore = (stats.twoFactorUsers / stats.totalUsers) * 40;
    score += twoFactorScore;

    // Account lockouts indicate good security (30% weight)
    const lockoutScore = Math.min((stats.lockedUsers / stats.totalUsers) * 30, 30);
    score += lockoutScore;

    // Low failure rate is good (30% weight)
    const failureRate = stats.recentFailedLogins / (stats.recentSuccessfulLogins + stats.recentFailedLogins);
    const failureScore = (1 - Math.min(failureRate, 1)) * 30;
    score += failureScore;

    return Math.round(Math.min(score, 100));
  }
}

module.exports = new AdminController();