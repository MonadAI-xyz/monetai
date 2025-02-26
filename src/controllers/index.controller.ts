import responsePreparer from '@middlewares/responseHandler.middleware';
import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return responsePreparer(200, { status: 'ok' })(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
