import { db } from '@database';
import { HttpError } from '@exceptions/http/HttpError';
import BaseService from './baseService.service';

class UserService extends BaseService {
  constructor() {
    super(db.User);
  }

  /**
   * Retrieves a user by ID.
   *
   * @param {string} id - The ID of the user.
   * @returns {Promise<User>} - The user.
   * @throws {HttpError} - If the user could not be retrieved.
   */
  public getById = async (
    id: string,
  ): Promise<//  User
  any> => {
    try {
      return await this.model.findOne({
        where: { id },
      });
    } catch (error) {
      throw new HttpError({ message: 'ERROR_MESSAGE.USER.ERROR.COULD_NOT_GET_USER_BY_ID', errors: error });
    }
  };
}

export default UserService;
