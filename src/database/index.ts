import config from '@config';
import HttpException from '@exceptions/http/HttpException';
import * as models from '@models';
import { logger } from '@utils/logger';
import cls from 'cls-hooked';
import _ from 'lodash';
import Sequelize from 'sequelize';

const namespace = cls.createNamespace(process.env.DB_CLS_NAMESPACE);
Sequelize['useCLS'](namespace);
const connectDb = config.postgres.main;
const options = {
  host: connectDb.host,
  dialect: connectDb.dialect as Sequelize.Dialect,
  timezone: '+00:00',
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    underscored: true,
    freezeTableName: true,
  },
  port: connectDb.port,
  dialectOptions: config.postgres.main.dialectOptions,
  pool: config.postgres.main.pool,
  logQueryParameters: config.app.env === 'development',
  logging: process.env.DB_LOG_LEVEL
    ? (query, time) => {
        if (process.env.DB_LOG_LEVEL === 'LOGGER') {
          logger.info({
            message: 'SEQUELIZE',
            query: query?.replace('Executed (default): ', ''),
            duration: `${time}`,
            labels: { origin: 'database' },
          });
        } else {
          console.log('--------- SEQUELIZE START ---------');
          console.log(query);
          console.log('--------- SEQUELIZE END ---------');
        }
      }
    : false,
  benchmark: true,
};
export const sequelize = new Sequelize.Sequelize(connectDb.database, connectDb.username, connectDb.password, options);

sequelize.query = function () {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line prefer-rest-params
  return Sequelize?.prototype?.query?.apply(this, arguments).catch(err => {
    const message = [];
    const errors = {};
    if (err instanceof Sequelize.ValidationError) {
      err.errors.forEach(error => {
        const errorMessage = _.capitalize(_.lowerCase(error.message));
        const camelCasePath = _.camelCase(error.path);
        errors[camelCasePath] = errorMessage;
        message.push(errorMessage);
      });
      throw new HttpException(400, message.join(', '), errors);
    } else if (err instanceof Sequelize.DatabaseError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(500, errorMessage, err);
    } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(500, errorMessage, err);
    } else if (err instanceof Sequelize.UniqueConstraintError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(409, errorMessage, err);
    } else if (err instanceof Sequelize.ConnectionError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(500, errorMessage, err);
    } else if (err instanceof Sequelize.TimeoutError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(504, errorMessage, err);
    } else if (err instanceof Sequelize.EmptyResultError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(404, errorMessage, err);
    } else if (err instanceof Sequelize.InstanceError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(400, errorMessage, err);
    } else if (err instanceof Sequelize.QueryError) {
      const errorMessage = _.capitalize(_.lowerCase(err.message));
      throw new HttpException(400, errorMessage, err);
    } else {
      throw new HttpException(400, err.message, err);
    }
  });
};

sequelize
  .authenticate()
  .then(async () => {
    logger.info({ message: `Database connection established successfully`, labels: { origin: 'database' } });
  })
  .catch((error: Error) => {
    logger.error({ message: `Unable to connect to the database. error=${error}`, labels: { origin: 'database' } });
  });

const initiatedModels: any = {};
Object.keys(models).forEach(key => {
  const currentModel = models[key];
  initiatedModels[key] = currentModel.initModel(sequelize);
});

Object.keys(initiatedModels).forEach(modelName => {
  if (initiatedModels[modelName] && initiatedModels[modelName].associate) {
    initiatedModels[modelName].associate(initiatedModels);
  }
});

export function transaction(task) {
  return getCurrentTransaction() ? task() : sequelize.transaction(task);
}

export function getCurrentTransaction() {
  return cls.getNamespace(process.env.DB_CLS_NAMESPACE).get('transaction') || null;
}

export const db = {
  ...initiatedModels,
  sequelize,
  Sequelize, // library
  transaction,
  getCurrentTransaction,
  models: initiatedModels,
};
export default db;
