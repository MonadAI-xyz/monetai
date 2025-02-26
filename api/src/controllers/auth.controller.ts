import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import responsePreparer from '@middlewares/responseHandler.middleware';
import { UserAttributes } from '@models';
import { NextFunction, Request, Response } from 'express';
import Services from '@services/index';

class AuthController {
  private authService = Services.getInstance()?.authService;

  public login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    let token: string = (req.headers['x-monetai-auth'] as string) || null;
    try {
      // call login services
      let user: UserAttributes = null;
      if (token) {
        user = await this.authService.loginWithToken(token);
      } else {
        if (!email || !password) throw new HttpBadRequest();

        user = await this.authService.login(email, password);

        token = this.authService.createToken({
          id: user.id,
          email: user.email,
        });
      }

      return responsePreparer(200, { token, user })(req, res, next);
    } catch (error) {
      console.log('ERR', error);
      next(error);
    }
  };
}

export default AuthController;
