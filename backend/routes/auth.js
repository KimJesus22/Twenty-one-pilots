/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticación de usuarios
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authService = require('../services/authService');

const router = express.Router();

// Registro de usuario
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario único
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico único
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña del usuario
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token de autenticación
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username solo puede contener letras, números y guiones bajos')
      .notEmpty()
      .withMessage('Username es requerido'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido')
      .isLength({ max: 254 })
      .withMessage('Email demasiado largo'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Contraseña debe tener entre 8 y 128 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  ],
  authController.register
);

// Login de usuario
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token de autenticación
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID del usuario
 *                     username:
 *                       type: string
 *                       description: Nombre de usuario
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Correo electrónico
 *       400:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido')
      .isLength({ max: 254 })
      .withMessage('Email demasiado largo'),
    body('password')
      .notEmpty()
      .withMessage('Contraseña requerida')
      .isLength({ max: 128 })
      .withMessage('Contraseña demasiado larga'),
  ],
  authController.login
);

// Obtener perfil de usuario (requiere autenticación)
router.get('/profile',
  authService.authenticateToken,
  authController.getProfile
);

// Actualizar perfil de usuario (requiere autenticación)
router.put('/profile',
  authService.authenticateToken,
  [
    body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username debe tener entre 3 y 30 caracteres'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  ],
  authController.updateProfile
);

module.exports = router;