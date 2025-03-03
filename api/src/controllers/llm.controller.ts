import { NextFunction, Request, Response } from 'express';
import responsePreparer from '@middlewares/responseHandler.middleware';
import Services from '@services/index';

class LLMController {
  private llmService = Services.getInstance()?.llmService;
  private readonly MESSAGE = "AI Decision Making Service";

  public getDecision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marketData = req.body;
      const decision = await this.llmService.getDecision(marketData);
      return responsePreparer(200, { decision })(req, res, next);
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