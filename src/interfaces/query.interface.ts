import { FindOptions } from 'sequelize';

export interface IFindOptions extends FindOptions {
  allowedKeys?: string[];
}
