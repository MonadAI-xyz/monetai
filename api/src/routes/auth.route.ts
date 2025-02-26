import { Router } from 'express';
import IRoute from '@interfaces/routes.interface';
import AuthController from '@controllers/auth.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { LoginRequestDTO } from '@dtos/auth.dto';

class AuthRoute implements IRoute {
  public path;
  public router = Router();
  public authController = new AuthController();

  constructor(path) {
    this.path = path;
    this.initializeRoutes(this.path || '');
  }

  private initializeRoutes(path) {
    this.router.post(`${path}/login`, validationMiddleware(LoginRequestDTO), this.authController.login);
    this.router.post(`${path}/token`, this.authController.login);
  }
}

export default AuthRoute;
