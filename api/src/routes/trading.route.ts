import { Router } from 'express';
import TradingController from '@controllers/trading.controller';
import Routes from '@interfaces/routes.interface';

class TradingRoute implements Routes {
  public path = '/trading';
  public router = Router();
  public tradingController = new TradingController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/history`, this.tradingController.getTradingHistory);
  }
}

export default TradingRoute;
