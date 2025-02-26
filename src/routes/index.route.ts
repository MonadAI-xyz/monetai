import IndexController from '@controllers/index.controller';
import IRoute from '@interfaces/routes.interface';
import { Router } from 'express';

class IndexRoute implements IRoute {
  public router = Router();
  public indexController = new IndexController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.indexController.index);
  }
}

export default IndexRoute;
