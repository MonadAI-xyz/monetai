import OpenAI from 'openai';
import config from '@config';

class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getDecision(marketData: {
    price: number;
    volume: number;
    rsi: number;
    macd: number;
    trend: string;
  }): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a crypto trading advisor. Provide ONLY 'Yes' or 'No' answers for whether to open a new position based on market data. No explanations."
          },
          {
            role: "user",
            content: `Based on this market data, should I open a new position? Answer with only Yes or No: ${JSON.stringify(marketData, null, 2)}`
          }
        ],
        model: process.env.OPENAI_MODEL || "gpt-4",
        temperature: 0.1,
        max_tokens: 10
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

export default LLMService; 