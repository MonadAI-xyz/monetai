import { NextFunction, RequestHandler, Response } from 'express';
import HttpException from '@exceptions/http/HttpException';
import { IRequestWithUser } from '@interfaces/auth.interface';

const responsePreparer = (status: number, data: any): RequestHandler => {
  return (req: IRequestWithUser, res: Response, next: NextFunction) => {
    if (!status || (status >= 400 && status <= 500)) {
      if (!data) {
        next(new HttpException(status || 500, data?.message, data?.errors));
      }

      next(new HttpException(status || 500, data?.message, data?.errors));
    } else {
      req.data = data;
      req.status = status;
      next();
    }
  };
};

export default responsePreparer;
