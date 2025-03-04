import config from '@config';
import { OpenAI } from 'openai';
import { logger } from '@utils/logger';
import MarketDataService, { MarketDataParams, TRADING_PAIRS } from './marketData.service';
import { getTimeRanges, timestampToDate } from '@utils/time';

class LLMService {
  private openai: OpenAI;
  private marketDataService: MarketDataService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
    this.marketDataService = new MarketDataService();
  }

  async getDecision(params?: Partial<MarketDataParams>) {
    try {
      const timeRanges = getTimeRanges();
      const marketDataParams = {
        from: params?.from || timeRanges.from,
        to: params?.to || timeRanges.to,
        resolution: params?.resolution || '240',
        symbol: 'BTCUSD' // Only analyze BTC/USD
      };

      // Get data for single pair
      const data = await this.marketDataService.getMarketData(marketDataParams);
      const indicators = this.calculateIndicators(data);

      // Optimize data for OpenAI
      const optimizedData = {
        price: indicators.price.current,
        changes: indicators.price.changes,
        technicals: {
          sma: {
            isAboveSMA20: indicators.technicals.sma.isAboveSMA20,
            isAboveSMA50: indicators.technicals.sma.isAboveSMA50
          },
          rsi: indicators.technicals.rsi,
          momentum: indicators.technicals.momentum,
          volatility: indicators.technicals.volatility.daily,
          support: indicators.technicals.levels.support,
          resistance: indicators.technicals.levels.resistance
        }
      };

      console.log(optimizedData);

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a BTC/USD trading advisor. Respond with ONLY raw JSON, no markdown or code blocks.`
          },
          {
            role: "user",
            content: `Based on this BTC/USD data, should we buy, sell, or wait?
                     
                     Data: ${JSON.stringify(optimizedData)}
                     
                     Return ONLY this JSON structure (no markdown, no code blocks):
                     {
                       "action": "BUY" | "SELL" | "WAIT",
                       "reasoning": {
                         "marketCondition": "brief state",
                         "technicalAnalysis": "key factors",
                         "riskAssessment": "risk level"
                       }
                     }`
          }
        ],
        model: process.env.OPENAI_MODEL || "gpt-4",
        temperature: 0.2,
        max_tokens: 250
      });

      let decision;
      try {
        // Remove any markdown code blocks if present
        const content = completion.choices[0].message.content.trim()
          .replace(/^```json\n/, '')  // Remove opening code block
          .replace(/\n```$/, '');     // Remove closing code block
        
        decision = JSON.parse(content);
      } catch (error) {
        logger.error({
          message: 'Failed to parse OpenAI response',
          content: completion.choices[0].message.content,
          error: error.message,
          labels: { origin: 'LLMService' }
        });
        throw new Error('Failed to parse AI response');
      }

      return {
        timestamp: new Date().toISOString(),
        pair: 'BTCUSD',
        indicators,
        recommendation: decision
      };
    } catch (error) {
      logger.error({ message: `Error in LLM service: ${error.message}`, labels: { origin: 'LLMService' } });
      throw error;
    }
  }

  private calculateIndicators(marketData: any) {
    try {
      // Basic validation
      if (!marketData || !marketData.t || marketData.t.length === 0) {
        logger.error({ 
          message: 'Missing timestamp data', 
          data: marketData,
          labels: { origin: 'LLMService.calculateIndicators' } 
        });
        return this.getDefaultIndicators();
      }

      // Use available data or defaults
      const prices = marketData.c && marketData.c.length > 0 ? marketData.c : 
                    marketData.o && marketData.o.length > 0 ? marketData.o : [];
      const volumes = marketData.v || [];
      const timestamps = marketData.t;

      if (prices.length === 0) {
        throw new Error('No price data available');
      }

      // Latest values
      const latestPrice = prices[prices.length - 1];
      const latestTimestamp = timestamps[timestamps.length - 1];
      
      // Price changes
      const dailyChange = this.calculatePriceChange(prices, 6); // 6 4-hour periods = 1 day
      const weeklyChange = this.calculatePriceChange(prices, 42); // 42 4-hour periods = 1 week
      const monthlyChange = this.calculatePriceChange(prices, 180); // 180 4-hour periods = 30 days
      
      // Moving Averages (in 4-hour periods)
      const sma20 = this.calculateSMA(prices, 20); // 3.3 days
      const sma50 = this.calculateSMA(prices, 50); // 8.3 days
      const sma200 = this.calculateSMA(prices, 200); // 33.3 days
      
      // Volatility for different periods
      const dailyVolatility = this.calculateVolatility(this.calculateReturns(prices.slice(-6)));
      const weeklyVolatility = this.calculateVolatility(this.calculateReturns(prices.slice(-42)));
      
      // Volume analysis
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const latestVolume = volumes[volumes.length - 1];
      const volumeTrend = (latestVolume / avgVolume - 1) * 100;

      // Support and Resistance
      const support = Math.min(...prices.slice(-30));
      const resistance = Math.max(...prices.slice(-30));

      return {
        timestamp: timestampToDate(latestTimestamp),
        price: {
          current: latestPrice,
          changes: {
            daily: dailyChange.toFixed(2),
            weekly: weeklyChange.toFixed(2),
            monthly: monthlyChange.toFixed(2)
          }
        },
        technicals: {
          sma: {
            sma20: sma20.toFixed(2),
            sma50: sma50.toFixed(2),
            sma200: sma200.toFixed(2),
            isAboveSMA20: latestPrice > sma20,
            isAboveSMA50: latestPrice > sma50,
            isAboveSMA200: latestPrice > sma200
          },
          volatility: {
            daily: (dailyVolatility * 100).toFixed(2),
            weekly: (weeklyVolatility * 100).toFixed(2)
          },
          volume: {
            current: latestVolume,
            trend: volumeTrend.toFixed(2),
            isAboveAverage: latestVolume > avgVolume
          },
          levels: {
            support: support.toFixed(2),
            resistance: resistance.toFixed(2),
            distanceToSupport: ((latestPrice - support) / latestPrice * 100).toFixed(2),
            distanceToResistance: ((resistance - latestPrice) / latestPrice * 100).toFixed(2)
          },
          rsi: this.calculateRSI(prices, 14).toFixed(2),
          momentum: this.calculateMomentum(prices, 14).toFixed(2)
        }
      };
    } catch (error) {
      logger.error({ 
        message: `Error calculating indicators: ${error.message}`,
        labels: { origin: 'LLMService.calculateIndicators' }
      });
      return this.getDefaultIndicators();
    }
  }

  private calculatePriceChange(prices: number[], periods: number): number {
    if (prices.length < periods) return 0;
    const recent = prices[prices.length - 1];
    const old = prices[prices.length - periods];
    return ((recent - old) / old) * 100;
  }

  private getDefaultIndicators() {
    return {
      timestamp: new Date().toISOString(),
      price: {
        current: 0,
        changes: {
          daily: "0",
          weekly: "0",
          monthly: "0"
        }
      },
      technicals: {
        sma: {
          sma20: "0",
          sma50: "0",
          sma200: "0",
          isAboveSMA20: false,
          isAboveSMA50: false,
          isAboveSMA200: false
        },
        volatility: {
          daily: "0",
          weekly: "0"
        },
        volume: {
          current: 0,
          trend: "0",
          isAboveAverage: false
        },
        levels: {
          support: "0",
          resistance: "0",
          distanceToSupport: "0",
          distanceToResistance: "0"
        },
        rsi: "0",
        momentum: "0"
      },
      error: "Invalid data"
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);
  }

  private calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50;

    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMomentum(prices: number[], period = 14): number {
    if (prices.length < period) return 0;
    return ((prices[prices.length - 1] / prices[prices.length - 1 - period]) - 1) * 100;
  }
}

export default LLMService; 