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
    bullBoard: {
      user: process.env.BULLBOARD_USER,
      pass: process.env.BULLBOARD_PASS,
    },
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
  redis: {
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
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
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
    },
    stork: {
      apiKey: process.env.STORK_API_KEY,
      baseUrl: 'https://rest.jp.stork-oracle.network/v1',
    },
  },
  contracts: {
    USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
    WBTC: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
    WETH: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
    WSOL: '0x5387C85A4965769f6B0Df430638a1388493486F1',
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
  zeroEx: {
    apiKey: process.env.ZERO_EX_API_KEY,
    baseUrl: 'https://api.0x.org',
  },
  chain: {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
  },
  curvance: {
    contracts: {
      universalBalance: process.env.CURVANCE_UNIVERSAL_BALANCE_ADDRESS,
      eTokens: {
        USDC: process.env.CURVANCE_ETOKEN_USDC_ADDRESS,
        WBTC: process.env.CURVANCE_ETOKEN_WBTC_ADDRESS,
        aUSD: process.env.CURVANCE_ETOKEN_AUSD_ADDRESS,
      },
      pTokens: {
        LUSD: process.env.CURVANCE_PTOKEN_LUSD_ADDRESS,
        USDC: process.env.CURVANCE_PTOKEN_USDC_ADDRESS,
        WBTC: process.env.CURVANCE_PTOKEN_WBTC_ADDRESS,
      },
    },
    decimals: {
      USDC: 6,
      WBTC: 8,
      aUSD: 18,
      LUSD: 18,
    },
    delegateAddress: process.env.WALLET_ADDRESS,
  },
  wallet: {
    address: process.env.WALLET_ADDRESS,
  },
};

export default cfg;
