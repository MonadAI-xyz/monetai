import { bool, cleanEnv, host, port, str } from 'envalid';

function validateEnv() {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    WEBSOCKET_PORT: port(),
    POSTGRES_USER: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_HOST: host(),
    POSTGRES_PORT: port(),
    POSTGRES_DATABASE: str(),
    POSTGRES_SSL_REQUIRE: bool(),
    POSTGRES_SSL_REJECTUNAUTH: bool(),
    DB_CLS_NAMESPACE: str(),
    JWT_SECRET: str(),
    JWT_ISSUER: str(),
    JWT_VALID_MINS: str(),
    BASE_URL: str(),
    MAIL_FROM_NAME: str(),
    MAIL_FROM_ADDRESS: str(),
    OAUTH_CLIENT_ID: str(),
    OAUTH_CLIENT_SECRET: str(),
    OAUTH_REDIRECT_URI: str(),
    OAUTH_REFRESH_TOKEN: str(),

    REDIS_HOST: host(),
    REDIS_PORT: port(),
    REDIS_PASSWORD: str(),
  });
}

export default validateEnv;
