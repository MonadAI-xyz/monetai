import config from '@config';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import { HttpNotFound } from '@exceptions/http/HttpNotFound';
import { HttpUnauthorized } from '@exceptions/http/HttpUnauthorized';
import { IRequestWithUser } from '@interfaces/auth.interface';
import cls from 'cls-hooked';
import { NextFunction, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import Services from '@services/index';
import { UserAttributes } from '@models';

const auth = config.auth;

// Create a CLS namespace for managing authUser
export const namespace = cls.createNamespace('authUser');

/**
 * Middleware for authenticating and authorizing users.
 * @param check - Optional parameter to specify additional authorization checks.
 * @returns Express request handler.
 */
const authMiddleware = (check?: 'USER' | 'ADMIN'): RequestHandler => {
  return async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const userService = Services.getInstance()?.userService;

    try {
      // Extract JWT from header
      const token: string = req.headers['x-monetai-auth'] || null;

      // Check if authentication token is provided
      if (!token) {
        return next(new HttpBadRequest('No authentication token provided'));
      }

      // Verify authentication token
      const authUser = jwt.verify(token, auth?.secret) as UserAttributes;
      const user = await userService.getById(authUser?.id);
      // Check if user exists
      if (!user) {
        return next(new HttpNotFound('User in provided token does not exist!'));
      }

      // Set user in CLS namespace
      await namespace.runPromise(async () => {
        namespace.set('user', user.toJSON ? user.toJSON() : user);
      });

      req.user = user;

      return next();
    } catch (error) {
      console.error('[AUTH MIDDLEWARE]', error);
      return next(new HttpUnauthorized('Wrong authentication token'));
    }
  };
};

export default authMiddleware;
