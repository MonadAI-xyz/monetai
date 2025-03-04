import 'dotenv/config';

const cfg = {
  app: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    sequelize: {
      searchBuilder: {
        logging: false,
        fields: {
          filter: 'filter',
          order: 'order',
          limit: 'limit',
          offset: 'offset',
        },
        defaultLimit: 50,
      },
    },
    baseUrl: process.env.BASE_URL,
  },

  auth: {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER,
    validMins: process.env.JWT_VALID_MINS ? parseInt(process.env.JWT_VALID_MINS) : 3600,
  },

  postgres: {
    main: {
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      host: process.env.POSTGRES_HOST,
      dialect: 'postgres',
      port: parseInt(process.env.POSTGRES_PORT),
      dialectOptions:
        process.env.POSTGRES_SSL_REQUIRE === 'true'
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: process.env.POSTGRES_SSL_REJECTUNAUTH === 'true',
              },
            }
          : {},
      pool: process.env.POSTGRES_POOL_MAX // only configure pool if one of the pool envars is set
        ? {
            max: parseInt(process.env.POSTGRES_POOL_MAX),
            min: parseInt(process.env.POSTGRES_POOL_MIN),
            acquire: parseInt(process.env.POSTGRES_POOL_ACQUIRE),
            idle: parseInt(process.env.POSTGRES_POOL_IDLE),
          }
        : {},
    },
  },
  ws: {
    port: process.env.WEBSOCKET_PORT,
  },
  mail: {
    mailName: process.env.MAIL_FROM_NAME,
    mailFromAddress: process.env.MAIL_FROM_ADDRESS,
    frontendUrl: process.env.FRONTEND_URL,
    OAuth: {
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      redirectUri: process.env.OAUTH_REDIRECT_URI,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
    },
    stork: {
      apiKey: process.env.STORK_API_KEY,
      baseUrl: 'https://rest.jp.stork-oracle.network/v1',
    },
  }
};

export default cfg;
