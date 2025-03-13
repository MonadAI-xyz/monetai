import {version} from '../../package.json';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MonetAI API Documentation',
    version,
    description: 'API documentation for MonetAI backend services',
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'LLM',
      description: 'AI/LLM related endpoints', 
    }
  ],
  paths: {
    '/auth/message': {
      get: {
        tags: ['Auth'],
        summary: 'Get authentication message',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify signature',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  walletAddress: {
                    type: 'string'
                  },
                  signature: {
                    type: 'string'
                  }
                },
                required: ['walletAddress', 'signature']
              }
            }
          }
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
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/llm/decision': {
      post: {
        tags: ['LLM'],
        summary: 'Get AI decision based on market data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  from: {
                    type: 'integer',
                    description: 'Start timestamp (Unix seconds)'
                  },
                  to: {
                    type: 'integer',
                    description: 'End timestamp (Unix seconds)'
                  },
                  resolution: {
                    type: 'string',
                    enum: ['1', '2', '5', '15', '30', '60', '120', '240', '360', '720', 'D', '1D', 'W', '1W', 'M', '1M'],
                    description: 'Time resolution'
                  },
                  symbol: {
                    type: 'string',
                    default: 'BTCUSD',
                    description: 'Asset symbol'
                  }
                },
                required: ['from', 'to', 'resolution']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        marketData: {
                          type: 'object'
                        },
                        decision: {
                          type: 'object'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerDocument;
