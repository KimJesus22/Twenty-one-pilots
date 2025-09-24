const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const authService = require('../services/authService');
const { requireRole, requirePermission, PERMISSIONS } = require('../middleware/rbac');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authService.authenticateToken);

// Aplicar middleware de RBAC - todas requieren rol admin
router.use(requireRole('admin'));

// Gestión de usuarios
router.get('/users',
  requirePermission(PERMISSIONS.USER_READ.resource, PERMISSIONS.USER_READ.action),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  adminController.getAllUsers
);

router.get('/users/:userId',
  requirePermission(PERMISSIONS.USER_READ.resource, PERMISSIONS.USER_READ.action),
  [
    param('userId').isMongoId().withMessage('ID de usuario inválido')
  ],
  adminController.getUserById
);

router.put('/users/:userId/role',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN.resource, PERMISSIONS.SYSTEM_ADMIN.action),
  [
    param('userId').isMongoId().withMessage('ID de usuario inválido'),
    body('role').isIn(['user', 'moderator', 'deployer', 'admin']).withMessage('Rol inválido')
  ],
  adminController.changeUserRole
);

router.post('/users/:userId/permissions',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN.resource, PERMISSIONS.SYSTEM_ADMIN.action),
  [
    param('userId').isMongoId().withMessage('ID de usuario inválido'),
    body('resource').notEmpty().withMessage('Recurso requerido'),
    body('action').isIn(['create', 'read', 'update', 'delete', 'admin']).withMessage('Acción inválida')
  ],
  adminController.grantPermission
);

router.delete('/users/:userId/permissions',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN.resource, PERMISSIONS.SYSTEM_ADMIN.action),
  [
    param('userId').isMongoId().withMessage('ID de usuario inválido'),
    body('resource').notEmpty().withMessage('Recurso requerido'),
    body('action').isIn(['create', 'read', 'update', 'delete', 'admin']).withMessage('Acción inválida')
  ],
  adminController.revokePermission
);

router.put('/users/:userId/lock',
  requirePermission(PERMISSIONS.USER_UPDATE.resource, PERMISSIONS.USER_UPDATE.action),
  [
    param('userId').isMongoId().withMessage('ID de usuario inválido'),
    body('lock').isBoolean().withMessage('Estado de bloqueo debe ser boolean')
  ],
  adminController.toggleUserLock
);

router.delete('/users/:userId',
  requirePermission(PERMISSIONS.USER_DELETE.resource, PERMISSIONS.USER_DELETE.action),
  [
    param('userId').isMongoId().withMessage('ID de usuario inválido')
  ],
  adminController.deleteUser
);

// Auditoría y logs
router.get('/audit',
  requirePermission(PERMISSIONS.AUDIT_READ.resource, PERMISSIONS.AUDIT_READ.action),
  [
    query('event').optional().isString(),
    query('userId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  adminController.getAuditLogs
);

// Estadísticas de seguridad
router.get('/security/stats',
  requirePermission(PERMISSIONS.SYSTEM_MONITOR.resource, PERMISSIONS.SYSTEM_MONITOR.action),
  adminController.getSecurityStats
);

module.exports = router;