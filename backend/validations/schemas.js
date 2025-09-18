const Joi = require('joi');

// Validaciones para User
const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'El nombre de usuario solo puede contener letras, números y guiones bajos'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Debe proporcionar un email válido'
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    username: Joi.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    email: Joi.string().email(),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      concerts: Joi.boolean()
    })
  })
};

// Validaciones para Album
const albumSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    releaseYear: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .required(),
    coverImage: Joi.string().uri().optional()
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(100),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
    coverImage: Joi.string().uri()
  })
};

// Validaciones para Song
const songSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    lyrics: Joi.string().max(10000).optional(),
    duration: Joi.string().pattern(/^([0-5]?[0-9]:)?[0-5][0-9]$/).optional(),
    album: Joi.string().hex().length(24).required()
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(100),
    lyrics: Joi.string().max(10000),
    duration: Joi.string().pattern(/^([0-5]?[0-9]:)?[0-5][0-9]$/)
  })
};

// Validaciones para Playlist
const playlistSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    isPublic: Joi.boolean().default(false)
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500),
    isPublic: Joi.boolean()
  }),

  addSong: Joi.object({
    songId: Joi.string().hex().length(24).required()
  })
};

// Validaciones para Product
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().valid('clothing', 'accessories', 'music', 'posters', 'other').required(),
    stock: Joi.number().integer().min(0).required(),
    image: Joi.string().uri().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(1000),
    price: Joi.number().min(0),
    category: Joi.string().valid('clothing', 'accessories', 'music', 'posters', 'other'),
    stock: Joi.number().integer().min(0),
    image: Joi.string().uri()
  })
};

// Middleware de validación
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors
      });
    }

    next();
  };
};

module.exports = {
  userSchemas,
  albumSchemas,
  songSchemas,
  playlistSchemas,
  productSchemas,
  validate
};