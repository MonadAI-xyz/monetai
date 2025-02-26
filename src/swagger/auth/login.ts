export default {
  post: {
    tags: ['Authentication'],
    summary: 'User login',
    operationId: 'login',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Auth',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Successful login',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Auth',
            },
          },
        },
      },
      500: {
        description: 'Server error',
      },
    },
  },
};
