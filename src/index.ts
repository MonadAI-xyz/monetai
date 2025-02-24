import express from 'express';
import { AIService } from './services/aiService';
import { MarketService } from './services/marketService';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

const aiService = new AIService();
const marketService = new MarketService();

app.use(express.json());

app.post('/analyze-market', async (req, res) => {
  try {
    // Fetch market data
    const marketData = await marketService.getMarketData();

    // Create a prompt for the AI
    const prompt = `Given the following market data: ${JSON.stringify(marketData)}, should the user engage in yield farming, take a long position, take a short position, or wait? Provide a detailed explanation.`;

    // Get AI suggestion
    const suggestion = await aiService.getAISuggestion(prompt);

    res.json({ suggestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while analyzing the market.' });
  }
});

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});