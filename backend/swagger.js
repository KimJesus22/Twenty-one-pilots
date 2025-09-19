const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Twenty One Pilots API',
    version: '1.0.0',
    description: 'API completa para la aplicación web de Twenty One Pilots',
    contact: {
      name: 'API Support',
      email: 'support@twentyonepilots.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'http://20.81.227.69',
      description: 'Production server (VPS)'
    },
    {
      url: 'https://api.twentyonepilots.com',
      description: 'Production server (Domain)'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            description: 'Nombre de usuario único'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico único'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'Contraseña del usuario'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            default: 'user',
            description: 'Rol del usuario'
          }
        }
      },
      Album: {
        type: 'object',
        required: ['title', 'releaseYear'],
        properties: {
          title: {
            type: 'string',
            description: 'Título del álbum'
          },
          releaseYear: {
            type: 'number',
            description: 'Año de lanzamiento'
          },
          coverImage: {
            type: 'string',
            description: 'URL de la imagen de portada'
          }
        }
      },
      Song: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            description: 'Título de la canción'
          },
          lyrics: {
            type: 'string',
            description: 'Letra de la canción'
          },
          duration: {
            type: 'string',
            description: 'Duración de la canción'
          },
          album: {
            type: 'string',
            description: 'ID del álbum al que pertenece'
          }
        }
      },
      Concert: {
        type: 'object',
        required: ['name', 'venue_name', 'start_date'],
        properties: {
          name: {
            type: 'string',
            description: 'Nombre del concierto'
          },
          venue_name: {
            type: 'string',
            description: 'Nombre del venue'
          },
          city: {
            type: 'string',
            description: 'Ciudad del concierto'
          },
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de inicio'
          },
          price: {
            type: 'string',
            description: 'Precio de las entradas'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './models/*.js'] // Rutas donde buscar las anotaciones
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  // Ruta para la documentación Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Twenty One Pilots API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Ruta para obtener la especificación JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Documentación Swagger disponible en: http://localhost:5000/api-docs');
};

module.exports = setupSwagger;