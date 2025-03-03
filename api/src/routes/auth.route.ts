import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import Routes from '@interfaces/routes.interface';

class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/message`, this.authController.getMessage);
    this.router.post(`${this.path}/verify`, this.authController.verifySignature);
  }
}

export default AuthRoute;
