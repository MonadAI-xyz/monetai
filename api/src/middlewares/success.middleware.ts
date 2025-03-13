import { NextFunction, Response } from 'express';
import { IRequestWithUser } from '@interfaces/auth.interface';

const successMiddleware = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    let data = req.data;
    if (!data || !req.status) {
      next();
    } else {
      return res.status(req?.status || 200).json({ data: data || {} });
    }
  } catch (error) {
    console.log('[SUCCESS MIDDLEWARE] Error:', error);
    next(error);
  }
};

export default successMiddleware;
