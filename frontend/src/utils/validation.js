import * as yup from 'yup';

/**
 * Esquemas de validación para formularios usando Yup
 * Proporciona validación robusta y sanitización de inputs
 */

// Esquema para login
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('El email es requerido')
    .email('Ingresa un email válido')
    .max(255, 'El email no puede tener más de 255 caracteres')
    .trim()
    .lowercase(),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede tener más de 128 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial'
    ),
});

// Esquema para registro
export const registerSchema = yup.object().shape({
  username: yup
    .string()
    .required('El nombre de usuario es requerido')
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede tener más de 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')
    .trim(),
  email: yup
    .string()
    .required('El email es requerido')
    .email('Ingresa un email válido')
    .max(255, 'El email no puede tener más de 255 caracteres')
    .trim()
    .lowercase(),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede tener más de 128 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial'
    ),
  confirmPassword: yup
    .string()
    .required('Confirma tu contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});

// Esquema para playlist
export const playlistSchema = yup.object().shape({
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'El nombre contiene caracteres no permitidos')
    .trim(),
  description: yup
    .string()
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .trim(),
  isPublic: yup
    .boolean()
    .default(false),
});

// Esquema para búsqueda de letras
export const lyricsSearchSchema = yup.object().shape({
  artist: yup
    .string()
    .max(100, 'El nombre del artista no puede tener más de 100 caracteres')
    .trim(),
  title: yup
    .string()
    .max(200, 'El título no puede tener más de 200 caracteres')
    .trim(),
  query: yup
    .string()
    .max(500, 'La consulta no puede tener más de 500 caracteres')
    .trim(),
});

// Esquema para geocoding
export const geocodingSchema = yup.object().shape({
  address: yup
    .string()
    .required('La dirección es requerida')
    .min(3, 'La dirección debe tener al menos 3 caracteres')
    .max(500, 'La dirección no puede tener más de 500 caracteres')
    .trim(),
});

// Esquema para productos de tienda
export const productSchema = yup.object().shape({
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(1, 'El nombre no puede estar vacío')
    .max(200, 'El nombre no puede tener más de 200 caracteres')
    .trim(),
  description: yup
    .string()
    .required('La descripción es requerida')
    .min(1, 'La descripción no puede estar vacía')
    .max(1000, 'La descripción no puede tener más de 1000 caracteres')
    .trim(),
  price: yup
    .number()
    .required('El precio es requerido')
    .positive('El precio debe ser mayor a 0')
    .max(999999.99, 'El precio no puede ser mayor a 999,999.99'),
  category: yup
    .string()
    .required('La categoría es requerida')
    .oneOf(['clothing', 'accessories', 'music', 'posters', 'other'], 'Categoría inválida'),
  stock: yup
    .number()
    .required('El stock es requerido')
    .integer('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  image: yup
    .string()
    .url('La URL de la imagen debe ser válida')
    .optional(),
});

// Esquema para checkout
export const checkoutSchema = yup.object().shape({
  items: yup
    .array()
    .of(
      yup.object().shape({
        productId: yup.string().required('ID de producto requerido'),
        quantity: yup
          .number()
          .required('Cantidad requerida')
          .integer('La cantidad debe ser un número entero')
          .min(1, 'La cantidad debe ser al menos 1'),
      })
    )
    .min(1, 'Debe haber al menos un item en el carrito'),
});

// Función para validar datos
export async function validateData(schema, data) {
  try {
    const validatedData = await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { isValid: true, data: validatedData };
  } catch (error) {
    const errors = {};
    error.inner.forEach((err) => {
      errors[err.path] = err.message;
    });
    return { isValid: false, errors };
  }
}

// Función para sanitizar strings
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicos
    .replace(/javascript:/gi, '') // Remover protocolos javascript
    .replace(/on\w+=/gi, '') // Remover event handlers
    .slice(0, 10000); // Limitar longitud
}

// Función para sanitizar objetos recursivamente
export function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

export default {
  loginSchema,
  registerSchema,
  playlistSchema,
  lyricsSearchSchema,
  geocodingSchema,
  productSchema,
  checkoutSchema,
  validateData,
  sanitizeString,
  sanitizeObject,
};