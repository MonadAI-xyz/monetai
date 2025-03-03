import { Router } from 'express';
import LLMController from '@controllers/llm.controller';
import Routes from '@interfaces/routes.interface';

class LLMRoute implements Routes {
  public path = '/llms';
  public router = Router();
  public llmController = new LLMController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/test`, this.llmController.test);
    this.router.post(`${this.path}/decision`, this.llmController.getDecision);
  }
}

export default LLMRoute; 