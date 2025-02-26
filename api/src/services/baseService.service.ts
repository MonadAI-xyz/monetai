import { isEmpty } from 'class-validator';
import type { CreateOptions, DestroyOptions, FindOptions, UpdateOptions } from 'sequelize';
import { camelCaseToUpperCase, extractSequelizeModelName, sanitizeWhere } from '@utils/utils';

class BaseService {
  public model: any;

  /**
   * Singleton Constructor for BaseService
   * @param {any} model - The Sequelize model to be used with this service.
   */
  constructor(model?: any) {
    this.model = model;
  }

  public setDependencies(dependencies: Record<string, any>): void {
    Object.assign(this, dependencies);
  }

  /**
   * Finds all records matching the given options.
   * @param {FindOptions} [options] - Options for querying.
   * @returns {Promise<any[]>} - Promise resolving to an array of records.
   */
  public async findAll(options?: FindOptions): Promise<any[]> {
    return await this.model.findAll(sanitizeWhere(options));
  }

  /**
   * Finds a record by its ID.
   * @param {string} id - The ID of the record to find.
   * @param {FindOptions} [options] - Options for querying.
   * @returns {Promise<any | null>} - Promise resolving to the found record or null.
   * @throws {Error} - Throws an error if the ID is empty.
   */
  public async findById(id: string, options?: FindOptions): Promise<any | null> {
    if (isEmpty(id)) throw new Error('ERROR_MESSAGE.BASE_SERVICE.ERROR.MISSING_ID');

    return await this.model.findByPk(id, sanitizeWhere(options));
  }

  /**
   * Finds a single record matching the given options.
   * @param {FindOptions} [options] - Options for querying.
   * @returns {Promise<any | null>} - Promise resolving to the found record or null.
   */
  public async find(options?: FindOptions): Promise<any | null> {
    return await this.model.findOne(sanitizeWhere(options));
  }

  /**
   * Creates a new record with the given data.
   * @param {any} data - The data for the new record.
   * @param {CreateOptions} [options] - Options for creating the record.
   * @returns {Promise<any | null>} - Promise resolving to the created record or null.
   */
  public async create(data: any, options?: CreateOptions): Promise<any | null> {
    return await this.model.create(data, sanitizeWhere(options));
  }

  /**
   * Updates records matching the given options with the provided data.
   * @param {any} data - The data to update.
   * @param {UpdateOptions} [options] - Options for updating records.
   * @returns {Promise<any | null>} - Promise resolving to the updated records or null.
   */
  public async edit(data: any, options?: UpdateOptions): Promise<any | null> {
    options.individualHooks = true;
    await this.model.update(data, sanitizeWhere(options));
    return this.find(options);
  }

  /**
   * Finds a record with the given options and updates it with the provided data.
   * @param {any} data - The data to update.
   * @param {FindOptions} [options] - Options for querying and updating.
   * @returns {Promise<any | null>} - Promise resolving to the updated record or null.
   * @throws {Error} - Throws an error if the record is not found.
   */
  public async findAndEdit(data: any, options?: FindOptions): Promise<any | null> {
    const currentModel = await this.find(options);
    if (!currentModel) throw new Error(`${camelCaseToUpperCase(extractSequelizeModelName(this.model.name))} not found`);
    return await currentModel.update(data, sanitizeWhere({ ...options, individualHooks: true }));
  }

  /**
   * Deletes records matching the given options.
   * @param {DestroyOptions} [options] - Options for deleting records.
   * @returns {Promise<any | null>} - Promise resolving to the number of affected rows or null.
   */
  public async delete(options?: DestroyOptions): Promise<any | null> {
    return await this.model.destroy(sanitizeWhere(options));
  }

  /**
   * Finds a record with the given options, deletes it, and returns the deleted record.
   * @param {FindOptions} [options] - Options for querying.
   * @returns {Promise<any | null>} - Promise resolving to the deleted record or null.
   * @throws {Error} - Throws an error if the record is not found.
   */
  public async findAndDelete(options?: FindOptions): Promise<any | null> {
    const currentModel = await this.find(options);
    if (!currentModel) throw new Error(`${camelCaseToUpperCase(extractSequelizeModelName(this.model.name))} not found`);

    await currentModel.destroy();
    return currentModel;
  }

  /**
   * Finds a record using the provided model and options, deletes it, and returns the deleted record.
   * @param {any} model - The Sequelize model to use for finding and deleting the record.
   * @param {FindOptions} options - Options for querying.
   * @returns {Promise<any>} - Promise resolving to the deleted record.
   */
  public async findAndDeleteWithModel(model: any, options: FindOptions): Promise<any> {
    const modelToDelete = await model.findOne(options);
    if (!modelToDelete) throw new Error('Record not found');

    await modelToDelete.destroy();
    return modelToDelete;
  }

  /**
   * Finds records using the provided model and options, deletes them, and returns the deleted records.
   * @param {any} model - The Sequelize model to use for finding and deleting the records.
   * @param {FindOptions} options - Options for querying.
   * @returns {Promise<any[]>} - Promise resolving to an array of deleted records.
   */
  public async findAndDeleteAll(model: any, options: any): Promise<any> {
    const modelsToDelete = await model.findAll(options);
    await model.destroy(options);

    return modelsToDelete;
  }
}

export default BaseService;
