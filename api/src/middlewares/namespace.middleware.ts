import { NextFunction, RequestHandler, Response } from 'express';
import HttpException from '@exceptions/http/HttpException';
import { IRequestWithUser } from '@interfaces/auth.interface';

const namespaceMiddleware = (namespace: string): RequestHandler => {
  return async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    try {
      req.namespace = namespace;
      next();
    } catch (error) {
      console.log('[NAMESPACE MIDDLEWARE]', error);
      next(new HttpException(500, error?.message));
    }
  };
};

export default namespaceMiddleware;
