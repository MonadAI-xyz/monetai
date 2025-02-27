import { NextFunction, Request, Response } from 'express';
import LLMService from '@services/llm.service';
import responsePreparer from '@middlewares/responseHandler.middleware';

class LLMController {
  private llmService = new LLMService();

  public getDecision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const marketData = req.body;
      const decision = await this.llmService.getDecision(marketData);
      return responsePreparer(200, { decision })(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default LLMController; 