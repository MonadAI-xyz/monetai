import responsePreparer from '@middlewares/responseHandler.middleware';
import { NextFunction, Request, Response } from 'express';
import Services from '@services/index';

class AuthController {
  private authService = Services.getInstance()?.authService;
  private readonly MESSAGE = 'Welcome to MonetAI! Sign this message to login.';

  public getMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return responsePreparer(200, { message: this.MESSAGE })(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  public verifySignature = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress, signature } = req.body;
      const result = await this.authService.verifySignature(walletAddress, signature);
      return responsePreparer(200, result)(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
