const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    res.status(500).json({ error: 'Error de autenticación' });
  }
};

// Middleware para verificar roles
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Acceso denegado - rol insuficiente' });
    }

    next();
  };
};

// Middleware para verificar roles múltiples
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado - rol insuficiente' });
    }

    next();
  };
};

// Middleware opcional - si hay token, lo valida pero no es requerido
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Ignorar errores y continuar sin autenticación
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireRoles,
  optionalAuth
};