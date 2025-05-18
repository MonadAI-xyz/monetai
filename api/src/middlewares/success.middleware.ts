import { NextFunction, Request, RequestHandler, Response } from 'express';
import { IRequestWithUser } from '@interfaces/auth.interface';

const successMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const reqWithUser = req as IRequestWithUser;
    const data = reqWithUser.data;
    if (!data || !reqWithUser.status) {
      next();
    } else {
      res.status(reqWithUser?.status || 200).json({ data: data || {} });
    }
  } catch (error) {
    console.log('[SUCCESS MIDDLEWARE] Error:', error);
    next(error);
  }
};

export default successMiddleware;
