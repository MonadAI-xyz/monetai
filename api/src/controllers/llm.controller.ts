import { NextFunction, Request, Response } from 'express';
import responsePreparer from '@middlewares/responseHandler.middleware';
import Services from '@services/index';
import { MarketDataParams } from '@services/marketData.service';

class LLMController {
  private llmService = Services.getInstance()?.llmService;
  private readonly MESSAGE = "AI Decision Making Service";

  public getDecision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: Partial<MarketDataParams> = {
        from: req.body.from,
        to: req.body.to,
        resolution: req.body.resolution,
        symbol: req.body.symbol
      };
      
      const result = await this.llmService.getDecision(params);
      return responsePreparer(200, result)(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  public test = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return responsePreparer(200, { message: this.MESSAGE })(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default LLMController; 