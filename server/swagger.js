const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./src/config/env');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FixAround API',
      version: '1.0.0',
      description: 'API documentation for FixAround — Smart Local Service & Emergency Repair Platform',
      contact: {
        name: 'FixAround Engineering Team',
        email: 'support@fixaround.com'
      }
    },
    servers: [
      {
        url: config.apiBaseUrl,
        description: `${config.env} environment`
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your raw JWT token here without typing "Bearer " (Swagger UI automatically prepends it).'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerSpec
};
