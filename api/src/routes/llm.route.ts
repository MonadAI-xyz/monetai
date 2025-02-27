import { Router } from 'express';
import LLMController from '@controllers/llm.controller';
import Routes from '@interfaces/routes.interface';

class LLMRoute implements Routes {
  public path = '/apis/llms';
  public router = Router();
  public llmController = new LLMController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Add a test GET route
    this.router.get(`${this.path}/test`, (req, res) => {
      res.json({ message: 'LLM route working' });
    });
    
    this.router.post(`${this.path}/decision`, this.llmController.getDecision);
  }
}

export default LLMRoute; 