import BaseService from '@services/baseService.service';
import config from '@config';
import { OpenAI } from 'openai';
import { logger } from '@utils/logger';
import MarketDataService, { MarketDataParams } from './marketData.service';
import { getTimeRanges, timestampToDate } from '@utils/time';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import TradingService from '@services/trading.service';
import { DecisionHistory } from '@models';

class LLMService extends BaseService {
  private openai: OpenAI;
  private deepseek: OpenAI;
  private marketDataService: MarketDataService | null = null;
  private tradingService: TradingService | null = null;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });

    this.deepseek = new OpenAI({
      baseURL: config.ai.deepseek.baseUrl,
      apiKey: config.ai.deepseek.apiKey,
    });
  }

  private async getCollectiveDecision(indicators: any): Promise<any> {
    const [gptResult, deepseekResult]: any[] = await Promise.allSettled([
      this.getModelDecision(this.openai, config.ai.openai.model, indicators),
      this.getModelDecision(this.deepseek, config.ai.deepseek.model, indicators),
    ]);

    // Handle different scenarios
    if (gptResult.status === 'rejected' && deepseekResult.status === 'rejected') {
      logger.error({
        message: 'Both AI models failed to respond',
        labels: { origin: 'LLMService' },
      });
      throw new Error('No AI models available for decision making');
    }

    // If one model fails, use the other one
    if (gptResult.status === 'rejected') {
      const decision = deepseekResult.value;
      return {
        ...decision,
        reasoning: {
          ...decision.reasoning,
          marketCondition: `DeepSeek Only: ${decision.reasoning.marketCondition}`,
        },
        confidence: 'MEDIUM',
      };
    }

    if (deepseekResult.status === 'rejected') {
      const decision = gptResult.value;
      return {
        ...decision,
        reasoning: {
          ...decision.reasoning,
          marketCondition: `GPT Only: ${decision.reasoning.marketCondition}`,
        },
        confidence: 'MEDIUM',
      };
    }

    // Both models responded successfully
    const gptDecision = gptResult.value;
    const deepseekDecision = deepseekResult.value;

    // If both agree, use that decision
    if (gptDecision.action === deepseekDecision.action) {
      return {
        action: gptDecision.action,
        reasoning: {
          marketCondition: `GPT & DeepSeek Agree: ${gptDecision.reasoning.marketCondition}`,
          technicalAnalysis: `Consensus: ${gptDecision.reasoning.technicalAnalysis}`,
          riskAssessment: this.combineRiskAssessments(gptDecision?.reasoning?.riskAssessment, deepseekDecision?.reasoning?.riskAssessment),
        },
        confidence: 'HIGH',
      };
    }

    // If they disagree, default to more conservative action
    return {
      action: 'WAIT',
      reasoning: {
        marketCondition: 'Mixed signals between GPT and DeepSeek',
        technicalAnalysis: `GPT suggests ${gptDecision.action}, DeepSeek suggests ${deepseekDecision.action}`,
        riskAssessment: 'HIGH due to model disagreement',
      },
      confidence: 'LOW',
    };
  }

  private async getModelDecision(client: OpenAI, model: string, indicators: any) {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a BTC/USD trading advisor. Respond with ONLY raw JSON, no markdown or code blocks.`,
        },
        {
          role: 'user',
          content: `Based on this BTC/USD data, should we buy, sell, or wait?
                   Data: ${JSON.stringify(indicators)}
                   Return ONLY this JSON structure (no markdown, no code blocks):
                   {
                     "action": "BUY" | "SELL" | "WAIT",
                     "reasoning": {
                       "marketCondition": "brief state",
                       "technicalAnalysis": "key factors",
                       "riskAssessment": "risk level"
                     }
                   }`,
        },
      ],
      model: model,
      temperature: 0.2,
      max_tokens: 250,
    });

    try {
      const content = completion.choices[0].message.content
        .trim()
        .replace(/^```json\n/, '')
        .replace(/\n```$/, '');

      return JSON.parse(content);
    } catch (error) {
      logger.error({
        message: 'Failed to parse model response',
        model,
        content: completion.choices[0].message.content,
        error: error.message,
        labels: { origin: 'LLMService' },
      });
      throw new HttpBadRequest(`Failed to parse ${model} response`);
    }
  }

  private combineRiskAssessments(gptRisk: string, deepseekRisk: string): string {
    const isHighRisk = (risk: string) => risk.toLowerCase().includes('high') || risk.toLowerCase().includes('volatile');

    if (isHighRisk(gptRisk) || isHighRisk(deepseekRisk)) {
      return 'HIGH';
    }
    return 'LOW';
  }

  public async makeDecision(params?: Partial<MarketDataParams>) {
    try {
      const timeRanges = getTimeRanges();
      const pair = 'BTCUSD';
      const marketDataParams = {
        from: params?.from || timeRanges.from,
        to: params?.to || timeRanges.to,
        resolution: params?.resolution || '240',
        symbol: 'BTCUSD',
      };

      const data = await this.marketDataService.getMarketData(marketDataParams);
      console.log('Market data', data);
      const indicators = this.calculateIndicators(data);
      const decision = await this.getCollectiveDecision(indicators);
      const decisionHistory = await DecisionHistory.create({
        decision,
      });
      decision.id = decisionHistory.id;

      // Execute trade if decision is BUY or SELL
      if (decision.action === 'BUY' || decision.action === 'SELL') {
        await this.handleTradeSignal(decision, pair);
      }

      return {
        timestamp: new Date().toISOString(),
        pair,
        indicators,
        recommendation: decision,
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
          labels: { origin: 'LLMService.calculateIndicators' },
        });
        return this.getDefaultIndicators();
      }

      // Use available data or defaults
      const prices = marketData.c && marketData.c.length > 0 ? marketData.c : marketData.o && marketData.o.length > 0 ? marketData.o : [];
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
            monthly: monthlyChange.toFixed(2),
          },
        },
        technicals: {
          sma: {
            sma20: sma20.toFixed(2),
            sma50: sma50.toFixed(2),
            sma200: sma200.toFixed(2),
            isAboveSMA20: latestPrice > sma20,
            isAboveSMA50: latestPrice > sma50,
            isAboveSMA200: latestPrice > sma200,
          },
          volatility: {
            daily: (dailyVolatility * 100).toFixed(2),
            weekly: (weeklyVolatility * 100).toFixed(2),
          },
          volume: {
            current: latestVolume,
            trend: volumeTrend.toFixed(2),
            isAboveAverage: latestVolume > avgVolume,
          },
          levels: {
            support: support.toFixed(2),
            resistance: resistance.toFixed(2),
            distanceToSupport: (((latestPrice - support) / latestPrice) * 100).toFixed(2),
            distanceToResistance: (((resistance - latestPrice) / latestPrice) * 100).toFixed(2),
          },
          rsi: this.calculateRSI(prices, 14).toFixed(2),
          momentum: this.calculateMomentum(prices, 14).toFixed(2),
        },
      };
    } catch (error) {
      logger.error({
        message: `Error calculating indicators: ${error.message}`,
        labels: { origin: 'LLMService.calculateIndicators' },
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
          daily: '0',
          weekly: '0',
          monthly: '0',
        },
      },
      technicals: {
        sma: {
          sma20: '0',
          sma50: '0',
          sma200: '0',
          isAboveSMA20: false,
          isAboveSMA50: false,
          isAboveSMA200: false,
        },
        volatility: {
          daily: '0',
          weekly: '0',
        },
        volume: {
          current: 0,
          trend: '0',
          isAboveAverage: false,
        },
        levels: {
          support: '0',
          resistance: '0',
          distanceToSupport: '0',
          distanceToResistance: '0',
        },
        rsi: '0',
        momentum: '0',
      },
      error: 'Invalid data',
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
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
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
    const gains = changes.map(change => (change > 0 ? change : 0));
    const losses = changes.map(change => (change < 0 ? -change : 0));

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMomentum(prices: number[], period = 14): number {
    if (prices.length < period) return 0;
    return (prices[prices.length - 1] / prices[prices.length - 1 - period] - 1) * 100;
  }

  async handleTradeSignal(decision: any, pair: string) {
    try {
      if (!decision.action || !['BUY', 'SELL'].includes(decision.action)) {
        logger.info('No trade action needed');
        return null;
      }

      const action = decision.action.toLowerCase() as 'buy' | 'sell';

      // Check if trade is viable before proceeding
      const viability = await this.tradingService.checkTradeViability(action);
      if (!viability.viable) {
        logger.warn({
          message: 'Trade not viable',
          reason: viability.reason,
          balance: viability.balance,
          token: viability.token,
          action,
          labels: { origin: 'LLMService' },
        });
        return null;
      }

      const riskLevel = 'HIGH';

      this.assessRiskLevel(decision.reasoning.riskAssessment);

      try {
        const amount = await this.tradingService.calculateTradeAmount(action, riskLevel);
        logger.info(`Executing ${action} ${pair} trade with ${amount} (${riskLevel} risk)`);
        return this.tradingService.executeSwap(action, pair, amount, decision);
      } catch (error) {
        if (error.message.includes('Insufficient balance')) {
          logger.warn({
            message: `[${pair}] Skipping trade due to insufficient balance`,
            action,
            error: error.message,
            labels: { origin: 'LLMService' },
          });
          return null;
        }
        throw error;
      }
    } catch (error) {
      logger.error({
        message: `Error executing trade: [${pair}] ${error.message}`,
        labels: { origin: 'LLMService.handleTradeSignal' },
      });
      throw error;
    }
  }

  private assessRiskLevel(riskAssessment: string): 'HIGH' | 'LOW' {
    // Convert risk assessment to lowercase for comparison
    const assessment = riskAssessment.toLowerCase();

    // Check for high risk indicators
    const highRiskTerms = ['high', 'volatile', 'unstable', 'risky', 'dangerous'];

    for (const term of highRiskTerms) {
      if (assessment.includes(term)) {
        return 'HIGH';
      }
    }

    return 'LOW';
  }
}

export default LLMService;
