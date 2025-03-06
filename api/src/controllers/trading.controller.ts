import { NextFunction, Request, Response } from 'express';
import responsePreparer from '@middlewares/responseHandler.middleware';
import Services from '@services/index';

class TradingController {
  private tradingService = Services.getInstance()?.tradingService;

  public getTradingHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tradingHistory = await this.tradingService.getTradingHistory(req.params);
      return responsePreparer(200, tradingHistory)(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default TradingController;
