import config from '@config';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import { HttpNotFound } from '@exceptions/http/HttpNotFound';
import { comparePassword } from '@utils/utils';
import jwt from 'jsonwebtoken';
import BaseService from '@services/baseService.service';
import UserService from '@services/user.service';
import { User } from '@models';
import { ethers } from 'ethers';
import { HttpUnauthorized } from '@exceptions/http/HttpUnauthorized';
import { v4 as uuidv4 } from 'uuid';
const { secret, validMins } = config.auth;

class AuthService extends BaseService {
  private userService: UserService | null = null;
  private readonly MESSAGE = "Welcome to MonetAI! Sign this message to login.";

  /**
   * Generates a JWT token for the given user.
   * @param user - The user object to be included in the token.
   * @returns A JWT token as a string.
   */
  public createToken(user: any): string {
    return jwt.sign(user, secret, {
      expiresIn: `${validMins}m`,
      issuer: config.auth.issuer,
    });
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
  
  public async verifySignature(walletAddress: string, signature: string): Promise<any> {
    try {
      const signerAddr = await ethers.utils.verifyMessage(this.MESSAGE, signature);
      console.log('signerAddr', signerAddr);
      console.log('walletAddress', walletAddress);
      
      const normalizedSignerAddr = signerAddr.toLowerCase();
      const normalizedWalletAddr = walletAddress.toLowerCase();
      
      console.log('normalizedSignerAddr', normalizedSignerAddr);
      console.log('normalizedWalletAddr', normalizedWalletAddr);
      console.log('addresses match:', normalizedSignerAddr === normalizedWalletAddr);

      if (normalizedSignerAddr !== normalizedWalletAddr) {
        throw new HttpUnauthorized('Invalid signature - addresses do not match');
      }

      try {
        // Use User model directly instead of db.users
        const [user] = await User.findOrCreate({
          where: { wallet_address: normalizedWalletAddr },
          defaults: { wallet_address: normalizedWalletAddr }
        });
        console.log('Created/Found user:', user);

        const token = this.createToken({
          id: user.id,
          wallet_address: user.wallet_address
        });
        console.log('Generated token:', token);

        const result = { token, user };
        console.log('Returning result:', result);
        return result;

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to create user or token');
      }

    } catch (error) {
      console.error('Verification error:', error);
      if (error instanceof HttpUnauthorized) {
        throw error;
      }
      throw new HttpUnauthorized('Invalid signature');
    }
  }
}

export default AuthService;
