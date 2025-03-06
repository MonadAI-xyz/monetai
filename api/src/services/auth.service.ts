import config from '@config';
import jwt from 'jsonwebtoken';
import BaseService from '@services/baseService.service';
import { User } from '@models';
import { ethers } from 'ethers';
import { HttpUnauthorized } from '@exceptions/http/HttpUnauthorized';

const { secret, validMins } = config.auth;

class AuthService extends BaseService {
  private readonly MESSAGE = 'Welcome to MonetAI! Sign this message to login.';

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
          defaults: { wallet_address: normalizedWalletAddr },
        });

        const token = this.createToken({
          id: user.id,
          wallet_address: user.wallet_address,
        });

        return { token, user };
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
