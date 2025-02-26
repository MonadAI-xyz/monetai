import 'reflect-metadata';

export default {
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API for managing common data',
  },
  components: {
    securitySchemes: {
      jwt: {
        type: 'apiKey',
        name: 'x-monetai-auth',
        in: 'header',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
          },
          internal_code: {
            type: 'string',
          },
        },
      },
    },
  },
};
