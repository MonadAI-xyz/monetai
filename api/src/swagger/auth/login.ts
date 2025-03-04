export const login = {
  '/auth/message': {
    get: {
      tags: ['Auth'],
      summary: 'Get message to sign',
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Welcome to MonetAI! Sign this message to login.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/auth/verify': {
    post: {
      tags: ['Auth'],
      summary: 'Verify wallet signature',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['walletAddress', 'signature'],
              properties: {
                walletAddress: {
                  type: 'string',
                },
                signature: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: {
                    type: 'string',
                  },
                  user: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
