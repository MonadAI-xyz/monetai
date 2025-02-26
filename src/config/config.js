require('dotenv/config');

const isTesting = process.env.NODE_ENV === 'testing';

const dbConfig = {
  username: isTesting ? process.env.POSTGRES_TEST_USER : process.env.POSTGRES_USER,
  password: isTesting ? process.env.POSTGRES_TEST_PASSWORD : process.env.POSTGRES_PASSWORD,
  database: isTesting ? process.env.POSTGRES_TEST_DATABASE : process.env.POSTGRES_DATABASE,
  host: isTesting ? process.env.POSTGRES_TEST_HOST : process.env.POSTGRES_HOST,
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
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_migrations',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seeders',
};

module.exports = dbConfig;
