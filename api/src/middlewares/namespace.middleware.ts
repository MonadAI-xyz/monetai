import { NextFunction, Request, Response } from 'express';
import HttpException from '@exceptions/http/HttpException';
import { IRequestWithUser } from '@interfaces/auth.interface';

const namespaceMiddleware = (namespace: string) => {
  return function middleware(req: Request, res: Response, next: NextFunction): void {
    try {
      (req as IRequestWithUser).namespace = namespace;
      next();
    } catch (error) {
      console.log('[NAMESPACE MIDDLEWARE]', error);
      next(new HttpException(500, error?.message));
    }
  };
};

export default namespaceMiddleware;
