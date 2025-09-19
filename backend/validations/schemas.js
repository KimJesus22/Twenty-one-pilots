const Joi = require('joi');

/**
 * Esquemas de validación reutilizables con Joi
 * Complementan las validaciones de express-validator
 */

// Esquemas de autenticación
const authSchemas = {
  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Username solo puede contener letras, números y guiones bajos',
        'string.min': 'Username debe tener al menos 3 caracteres',
        'string.max': 'Username no puede tener más de 30 caracteres',
        'any.required': 'Username es requerido'
      }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(254)
      .required()
      .messages({
        'string.email': 'Email inválido',
        'string.max': 'Email demasiado largo',
        'any.required': 'Email es requerido'
      }),

    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Contraseña debe tener al menos 8 caracteres',
        'string.max': 'Contraseña demasiado larga',
        'string.pattern.base': 'Contraseña debe contener al menos una letra minúscula, una mayúscula y un número',
        'any.required': 'Contraseña es requerida'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(254)
      .required()
      .messages({
        'string.email': 'Email inválido',
        'string.max': 'Email demasiado largo',
        'any.required': 'Email es requerido'
      }),

    password: Joi.string()
      .max(128)
      .required()
      .messages({
        'string.max': 'Contraseña demasiado larga',
        'any.required': 'Contraseña es requerida'
      })
  }),

  updateProfile: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({
        'string.pattern.base': 'Username solo puede contener letras, números y guiones bajos',
        'string.min': 'Username debe tener al menos 3 caracteres',
        'string.max': 'Username no puede tener más de 30 caracteres'
      }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(254)
      .messages({
        'string.email': 'Email inválido',
        'string.max': 'Email demasiado largo'
      })
  }).min(1).messages({
    'object.min': 'Al menos un campo debe ser proporcionado para actualizar'
  })
};

// Esquemas de discografía
const discographySchemas = {
  album: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.min': 'Título del álbum es requerido',
        'string.max': 'Título del álbum demasiado largo',
        'any.required': 'Título del álbum es requerido'
      }),

    releaseYear: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .required()
      .messages({
        'number.min': 'Año de lanzamiento inválido',
        'number.max': 'Año de lanzamiento no puede ser futuro',
        'any.required': 'Año de lanzamiento es requerido'
      }),

    coverImage: Joi.string()
      .uri()
      .allow('')
      .optional()
      .messages({
        'string.uri': 'URL de imagen de portada inválida'
      })
  }),

  song: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.min': 'Título de la canción es requerido',
        'string.max': 'Título de la canción demasiado largo',
        'any.required': 'Título de la canción es requerido'
      }),

    album: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de álbum inválido',
        'any.required': 'Álbum es requerido'
      }),

    lyrics: Joi.string()
      .max(50000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Letras demasiado largas'
      }),

    duration: Joi.string()
      .pattern(/^(\d{1,2}:)?\d{1,2}:\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Formato de duración inválido (MM:SS o H:MM:SS)'
      })
  }),

  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.min': 'Página debe ser mayor a 0'
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.min': 'Límite debe ser mayor a 0',
        'number.max': 'Límite no puede ser mayor a 100'
      }),

    sort: Joi.string()
      .valid('title', 'releaseYear', 'createdAt', 'duration')
      .default('createdAt')
      .messages({
        'any.only': 'Campo de ordenamiento inválido'
      }),

    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Orden debe ser asc o desc'
      }),

    search: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Término de búsqueda demasiado corto',
        'string.max': 'Término de búsqueda demasiado largo'
      }),

    album: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'ID de álbum inválido'
      })
  })
};

// Esquemas de videos
const videoSchemas = {
  search: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .default('Twenty One Pilots')
      .messages({
        'string.min': 'Término de búsqueda requerido',
        'string.max': 'Término de búsqueda demasiado largo'
      }),

    maxResults: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.min': 'Máximo de resultados debe ser mayor a 0',
        'number.max': 'Máximo de resultados no puede ser mayor a 50'
      })
  }),

  videoId: Joi.object({
    id: Joi.string()
      .pattern(/^[a-zA-Z0-9_-]{11}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de video de YouTube inválido',
        'any.required': 'ID de video es requerido'
      })
  })
};

// Esquemas de conciertos
const concertSchemas = {
  search: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .default('Twenty One Pilots')
      .messages({
        'string.min': 'Término de búsqueda requerido',
        'string.max': 'Término de búsqueda demasiado largo'
      }),

    location: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Ubicación requerida',
        'string.max': 'Ubicación demasiado larga'
      }),

    maxResults: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.min': 'Máximo de resultados debe ser mayor a 0',
        'number.max': 'Máximo de resultados no puede ser mayor a 50'
      })
  }),

  locationSearch: Joi.object({
    location: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Ubicación requerida',
        'string.max': 'Ubicación demasiado larga',
        'any.required': 'Ubicación es requerida'
      }),

    radius: Joi.number()
      .min(1)
      .max(100)
      .default(50)
      .messages({
        'number.min': 'Radio debe ser mayor a 0',
        'number.max': 'Radio no puede ser mayor a 100 km'
      }),

    maxResults: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.min': 'Máximo de resultados debe ser mayor a 0',
        'number.max': 'Máximo de resultados no puede ser mayor a 50'
      })
  })
};

// Esquemas de playlists
const playlistSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Nombre de playlist requerido',
        'string.max': 'Nombre de playlist demasiado largo',
        'any.required': 'Nombre de playlist es requerido'
      }),

    description: Joi.string()
      .max(500)
      .trim()
      .allow('')
      .optional()
      .messages({
        'string.max': 'Descripción demasiado larga'
      }),

    isPublic: Joi.boolean()
      .default(false),

    songs: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'ID de canción inválido'
          })
      )
      .default([])
      .messages({
        'array.base': 'Songs debe ser un array'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .messages({
        'string.min': 'Nombre de playlist requerido',
        'string.max': 'Nombre de playlist demasiado largo'
      }),

    description: Joi.string()
      .max(500)
      .trim()
      .allow('')
      .messages({
        'string.max': 'Descripción demasiado larga'
      }),

    isPublic: Joi.boolean()
  }).min(1).messages({
    'object.min': 'Al menos un campo debe ser proporcionado para actualizar'
  }),

  addSong: Joi.object({
    songId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID de canción inválido',
        'any.required': 'ID de canción es requerido'
      })
  })
};

// Función de validación reutilizable
const validate = (schema, data, options = {}) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context.value
    }));

    return { isValid: false, errors, value: null };
  }

  return { isValid: true, errors: null, value };
};

module.exports = {
  authSchemas,
  discographySchemas,
  videoSchemas,
  concertSchemas,
  playlistSchemas,
  validate
};