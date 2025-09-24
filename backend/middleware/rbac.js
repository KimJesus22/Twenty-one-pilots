const auditService = require('../services/auditService');

/**
 * Middleware para control de acceso basado en roles (RBAC)
 */
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        await auditService.logUnauthorizedAccess(
          'anonymous',
          resource,
          action,
          req.ip,
          req.get('User-Agent')
        );
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has the required permission
      if (!user.hasPermission(resource, action)) {
        await auditService.logUnauthorizedAccess(
          user._id,
          resource,
          action,
          req.ip,
          req.get('User-Agent')
        );
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Log successful authorization
      await auditService.log('AUTHORIZATION_SUCCESS', {
        userId: user._id,
        resource,
        action,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!user.hasRole(requiredRole)) {
        await auditService.logUnauthorizedAccess(
          user._id,
          'role',
          requiredRole,
          req.ip,
          req.get('User-Agent')
        );
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges'
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Role verification error'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario es propietario del recurso
 */
const requireOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceId = req.params[resourceIdParam];

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user owns the resource or has admin privileges
      if (resourceId !== user._id.toString() && !user.hasRole('admin')) {
        await auditService.logUnauthorizedAccess(
          user._id,
          'ownership',
          resourceId,
          req.ip,
          req.get('User-Agent')
        );
        return res.status(403).json({
          success: false,
          message: 'Access denied: not resource owner'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership verification error'
      });
    }
  };
};

/**
 * Permisos predefinidos para recursos comunes
 */
const PERMISSIONS = {
  // User management
  USER_MANAGE: { resource: 'users', action: 'admin' },
  USER_READ: { resource: 'users', action: 'read' },
  USER_UPDATE: { resource: 'users', action: 'update' },
  USER_DELETE: { resource: 'users', action: 'delete' },

  // Content management
  CONTENT_MANAGE: { resource: 'content', action: 'admin' },
  CONTENT_CREATE: { resource: 'content', action: 'create' },
  CONTENT_READ: { resource: 'content', action: 'read' },
  CONTENT_UPDATE: { resource: 'content', action: 'update' },
  CONTENT_DELETE: { resource: 'content', action: 'delete' },

  // System administration
  SYSTEM_ADMIN: { resource: 'system', action: 'admin' },
  SYSTEM_MONITOR: { resource: 'system', action: 'read' },
  SYSTEM_CONFIG: { resource: 'system', action: 'update' },

  // Deployment permissions
  DEPLOY_STAGING: { resource: 'deployment', action: 'staging' },
  DEPLOY_PRODUCTION: { resource: 'deployment', action: 'production' },

  // Audit permissions
  AUDIT_READ: { resource: 'audit', action: 'read' },
  AUDIT_ADMIN: { resource: 'audit', action: 'admin' }
};

module.exports = {
  requirePermission,
  requireRole,
  requireOwnership,
  PERMISSIONS
};