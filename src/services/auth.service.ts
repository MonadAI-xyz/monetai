import config from '@config';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import { HttpNotFound } from '@exceptions/http/HttpNotFound';
import { comparePassword } from '@utils/utils';
import jwt from 'jsonwebtoken';
import BaseService from '@services/baseService.service';
import UserService from '@services/user.service';
import { User } from '@models';

const { secret, validMins } = config.auth;

class AuthService extends BaseService {
  private userService: UserService | null = null;

  /**
   * Generates a JWT token for the given user.
   * @param user - The user object to be included in the token.
   * @returns A JWT token as a string.
   */
  public createToken(user: any): string {
    const expiresIn = 60 * validMins; // Token expiration time in seconds
    return jwt.sign({ id: user.id }, secret, { expiresIn });
  }

  /**
   * Authenticates a user with email and password.
   * @param email - The email address of the user trying to log in.
   * @param password - The password provided by the user.
   * @returns A promise that resolves to the authenticated User object.
   * @throws HttpBadRequest - If the user is not found or the password is incorrect.
   */
  public async login(email: string, password: string): Promise<User> {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new HttpBadRequest('ERROR_MESSAGE.AUTH.ERROR.INCORRECT_PASSWORD');
    }

    return this.userService.getById(user.id);
  }

  /**
   * Authenticates a user using a JWT token.
   * @param token - The JWT token used for authentication.
   * @returns A promise that resolves to the authenticated User object.
   * @throws HttpNotFound - If the user associated with the token is not found.
   */
  public async loginWithToken(token: string): Promise<User> {
    let decodedToken: { id: string };

    try {
      decodedToken = jwt.verify(token, secret) as { id: string };
    } catch {
      throw new HttpBadRequest('ERROR_MESSAGE.AUTH.ERROR.INVALID_TOKEN');
    }

    const user = await User.findOne({ where: { id: decodedToken.id } });

    if (!user) {
      throw new HttpNotFound();
    }

    return user;
  }
}

export default AuthService;
