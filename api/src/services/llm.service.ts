import BaseService from '@services/baseService.service';
import config from '@config';
import { OpenAI } from 'openai';
import { logger } from '@utils/logger';
import MarketDataService, { MarketDataParams } from './marketData.service';
import { getTimeRanges, timestampToDate } from '@utils/time';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import TradingService from '@services/trading.service';
import { DecisionHistory } from '@models';
import _ from 'lodash';
import { sequelizeQueryBuilder } from '@utils/utils';
import { HttpError } from '@exceptions/http/HttpError';
import CurvanceService from './curvance.service';

class LLMService extends BaseService {
  private openai: OpenAI;
  private deepseek: OpenAI;
  private marketDataService: MarketDataService | null = null;
  private tradingService: TradingService | null = null;
  private curvanceService: CurvanceService | null = null;
  private wallet = { address: config.wallet.address };

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
        shouldExecute: gptDecision.action === 'BUY' || gptDecision.action === 'SELL',
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
      shouldExecute: false,
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

  public async makeDecision(params: Partial<MarketDataParams>) {
    try {
      const timeRanges = getTimeRanges();
      const pair = 'BTC_USD';
      const marketDataParams = {
        from: params?.from || timeRanges.from,
        to: params?.to || timeRanges.to,
        resolution: params?.resolution || '240',
        symbol: _.replace(pair, /_/g, ''),
      };

      // Get both trading and lending market data
      const [tradingMarketData, curvanceMarketData] = await Promise.all([
        this.marketDataService.getMarketData(marketDataParams),
        this.curvanceService.getMarketData()
      ]);

      // Get trading decision
      const tradingIndicators = this.calculateIndicators(tradingMarketData);
      const tradingDecision = await this.getCollectiveDecision(tradingIndicators);

      // Get Curvance decision
      const curvanceDecision = await this.getAIDecision({
        trading: tradingMarketData,
        lending: curvanceMarketData
      });

      // Execute both decisions if needed
      const executions = await Promise.allSettled([
        // Execute trade if shouldExecute is true
        tradingDecision.shouldExecute 
          ? this.handleTradeSignal(tradingDecision, pair)
          : Promise.resolve(),
          
        // Execute Curvance actions if shouldExecute is true
        curvanceDecision.shouldExecute && curvanceDecision.actions?.length > 0
          ? this.executeCurvanceDecision(curvanceDecision, curvanceMarketData)
          : Promise.resolve()
      ]);

      // Save combined decision history
      const decisionHistory = await DecisionHistory.create({
        decision: {
          trading: tradingDecision,
          curvance: {
            ...curvanceDecision,
            executionResults: executions[1].status === 'fulfilled' ? executions[1].value : null
          }
        },
      });

      return {
        timestamp: new Date().toISOString(),
        pair,
        indicators: {
          trading: tradingIndicators,
          lending: this.formatLendingMetrics(curvanceMarketData)
        },
        recommendations: {
          trading: {
            ...tradingDecision,
            id: decisionHistory.id
          },
          curvance: {
            ...curvanceDecision,
            id: decisionHistory.id
          }
        }
      };
    } catch (error) {
      logger.error({ 
        message: `Error in LLM service: ${error.message}`, 
        labels: { origin: 'LLMService' } 
      });
      throw error;
    }
  }

  private async getAIDecision(marketData: any) {
    try {
      const lendingMetrics = this.formatLendingMetrics(marketData.lending);

      const prompt = `
        Analyze the following Curvance lending market data and recommend optimal lending/borrowing strategies:
        
        Market Data:
        ${JSON.stringify(lendingMetrics, null, 2)}
        
        Consider these key factors:

        1. Lending Opportunities:
        - Compare interest rates across all tokens (WBTC, USDC, AUSD, LUSD)
        - Evaluate supply/demand dynamics and utilization rates
        - Assess stability and sustainability of yields
        - Consider liquidity depth and withdrawal risks

        2. Borrowing Opportunities:
        - Identify lowest borrowing costs across tokens
        - Calculate potential leverage ratios
        - Evaluate liquidation risks based on collateral ratios
        - Consider market volatility impact on positions

        3. Interest Rate Arbitrage:
        - Find profitable spreads between lending and borrowing rates
        - Calculate net yield after fees and gas costs
        - Consider position size impact on rates
        - Evaluate sustainability of arbitrage opportunities

        4. Risk Assessment:
        - Market volatility and trend analysis
        - Collateral health and liquidation thresholds
        - Protocol utilization and liquidity risks
        - Correlation between asset prices

        Return a JSON response with:
        {
          "action": "LEND" | "BORROW" | "WITHDRAW" | "WAIT",
          "token": "USDC" | "WBTC" | "aUSD" | "LUSD",
          "amount": "number as string",
          "reasoning": {
            "marketAnalysis": "Detailed analysis of market conditions and opportunities",
            "riskAssessment": "Comprehensive risk evaluation",
            "yieldStrategy": "Expected returns and strategy rationale"
          },
          "actions": [{
            "type": "DEPOSIT" | "WITHDRAW" | "BORROW",
            "token": "string",
            "amount": "string",
            "recipient": "string",
            "expectedYield": "string",
            "liquidationRisk": "LOW" | "MEDIUM" | "HIGH"
          }]
        }

        Prioritize:
        1. Capital preservation over maximum yield
        2. Sustainable yields over temporary rate spikes
        3. Liquidity availability for position management
        4. Risk-adjusted returns considering all factors
      `;

      // Get decisions from both models
      const [gptResult, deepseekResult]: any[] = await Promise.allSettled([
        this.getModelDecision(this.openai, config.ai.openai.model, {
          lending: lendingMetrics,
          prompt
        }),
        this.getModelDecision(this.deepseek, config.ai.deepseek.model, {
          lending: lendingMetrics,
          prompt
        })
      ]);

      // Parse and validate decisions
      const decision = this.parseCurvanceDecision(gptResult, deepseekResult);

      // Set shouldExecute based on action type
      decision.shouldExecute = decision.action !== 'WAIT' && decision.actions?.length > 0;

      return decision;
    } catch (error) {
      logger.error({
        message: 'Error getting Curvance decision',
        error: error.message,
        labels: { origin: 'LLMService' },
      });
      return {
        action: 'WAIT',
        shouldExecute: false,
        confidence: 'LOW',
        actions: [],
        reasoning: {
          marketAnalysis: 'Error occurred while getting decision',
          riskAssessment: 'HIGH',
          yieldStrategy: 'No strategy due to error'
        }
      };
    }
  }

  private parseCurvanceDecision(gptResult: any, deepseekResult: any) {
    try {
      // Handle rejected promises
      if (gptResult.status === 'rejected' && deepseekResult.status === 'rejected') {
        return {
          action: 'WAIT',
          shouldExecute: false,
          confidence: 'LOW',
          actions: [],
          reasoning: {
            marketAnalysis: 'Both models failed to respond',
            riskAssessment: 'HIGH'
          }
        };
      }

      // Parse successful responses
      const gptDecision = gptResult.status === 'fulfilled' ? 
        (typeof gptResult.value === 'string' ? JSON.parse(gptResult.value) : gptResult.value) : null;
      const deepseekDecision = deepseekResult.status === 'fulfilled' ? 
        (typeof deepseekResult.value === 'string' ? JSON.parse(deepseekResult.value) : deepseekResult.value) : null;

      // If one model fails, use the other with medium confidence
      if (!gptDecision) {
        return {
          ...deepseekDecision,
          confidence: 'MEDIUM',
          actions: deepseekDecision.actions || [],
          shouldExecute: false
        };
      }

      if (!deepseekDecision) {
        return {
          ...gptDecision,
          confidence: 'MEDIUM',
          actions: gptDecision.actions || [],
          shouldExecute: false
        };
      }
      
      // If both agree on the action and token, merge their decisions
      if (gptDecision.action === deepseekDecision.action) {
        return {
          action: gptDecision.action,
          token: gptDecision.token,
          confidence: 'HIGH',
          shouldExecute: gptDecision.action !== 'WAIT',
          reasoning: {
            marketAnalysis: `GPT & DeepSeek Agree: ${gptDecision.reasoning.marketCondition || gptDecision.reasoning.marketAnalysis}`,
            riskAssessment: gptDecision.reasoning.riskAssessment
          },
          // Ensure actions array exists
          actions: [
            ...(gptDecision.actions || []),
            ...(deepseekDecision.actions || [])
          ].map(action => ({
            ...action,
            amount: action?.amount?.toString() || '0',
            recipient: action?.recipient || this.wallet.address
          }))
        };
      }

      // If they disagree, take the conservative approach
      logger.info({
        message: 'Models disagree on Curvance strategy',
        gpt: gptDecision,
        deepseek: deepseekDecision,
        labels: { origin: 'LLMService' },
      });

      return {
        action: 'WAIT',
        shouldExecute: false,
        confidence: 'LOW',
        actions: [],
        reasoning: {
          marketAnalysis: 'Models disagree on market strategy',
          riskAssessment: 'HIGH due to model disagreement'
        }
      };
    } catch (error) {
      logger.error({
        message: 'Error parsing Curvance decision',
        gpt: gptResult,
        deepseek: deepseekResult,
        error: error.message,
        labels: { origin: 'LLMService' },
      });
      return {
        action: 'WAIT',
        shouldExecute: false,
        confidence: 'LOW',
        actions: [],
        reasoning: {
          marketAnalysis: 'Error parsing model responses',
          riskAssessment: 'HIGH'
        }
      };
    }
  }

  private formatLendingMetrics(lendingData: any) {
    return {
      interestRates: Object.entries(lendingData.interestRates).reduce((acc, [token, rate]) => {
        acc[token] = `${(parseFloat(rate as string) * 100).toFixed(2)}%`;
        return acc;
      }, {}),
      utilization: Object.keys(lendingData.liquidity).reduce((acc, token) => {
        const { totalBorrows, totalSupply } = lendingData.liquidity[token];
        acc[token] = (parseFloat(totalBorrows) / parseFloat(totalSupply) * 100).toFixed(2) + '%';
        return acc;
      }, {}),
      availableLiquidity: Object.keys(lendingData.liquidity).reduce((acc, token) => {
        const { totalSupply, totalBorrows } = lendingData.liquidity[token];
        acc[token] = (parseFloat(totalSupply) - parseFloat(totalBorrows)).toString();
        return acc;
      }, {}),
      userBalances: lendingData.balances,
      collateralRatios: lendingData.collateralRatios,
    };
  }

  private async executeCurvanceDecision(decision: any, currentMarketData: any) {
    try {
      // Validate decision before execution
      if (!decision.shouldExecute || decision.action === 'WAIT' || !decision.actions?.length) {
        return null;
      }

      // Validate market conditions haven't changed significantly
      const isStillValid = this.validateCurvanceConditions(decision, currentMarketData);
      if (!isStillValid) {
        logger.warn({
          message: 'Market conditions changed significantly, skipping Curvance execution',
          labels: { origin: 'LLMService' },
        });
        return null;
      }

      // Execute actions and return results
      const results = [];
      for (const action of decision.actions) {
        try {
          let result;
          switch (action.type) {
            case 'DEPOSIT':
              result = await this.curvanceService.depositFunds(
                action.amount,
                action.token
              );
              break;

            case 'WITHDRAW':
              result = await this.curvanceService.withdrawFunds(
                action.amount,
                action.token,
                action.recipient || this.wallet.address
              );
              break;

            case 'BORROW':
              result = await this.curvanceService.borrowFunds(
                action.amount,
                action.token,
                action.recipient || this.wallet.address
              );
              break;

            default:
              logger.warn({
                message: `Unknown action type: ${action.type}`,
                action,
                labels: { origin: 'LLMService' },
              });
              continue;
          }

          results.push({
            action,
            success: true,
            txHash: result.hash,
          });

          logger.info({
            message: `Successfully executed ${action.type}`,
            action,
            txHash: result.hash,
            labels: { origin: 'LLMService' },
          });

        } catch (error) {
          logger.error({
            message: `Failed to execute ${action.type}`,
            action,
            error: error.message,
            labels: { origin: 'LLMService' },
          });

          results.push({
            action,
            success: false,
            error: error.message,
          });
        }
      }

      // Update decision history with execution results
      await DecisionHistory.update(
        {
          decision: {
            ...decision,
            executionResults: results,
            executedAt: new Date().toISOString(),
          },
        },
        {
          where: {
            id: decision.id
          }
        }
      );

      return results;
    } catch (error) {
      logger.error({
        message: 'Error executing Curvance decision',
        error: error.message,
        labels: { origin: 'LLMService' },
      });
      return null;
    }
  }

  private validateCurvanceConditions(decision: any, currentMarket: any): boolean {
    try {
      // Check if user has sufficient balances for the actions
      for (const action of decision.actions) {
        const token = action.token;
        const amount = parseFloat(action.amount);

        // For deposits and withdrawals, check user's balance
        if (action.type === 'DEPOSIT') {
          const balance = parseFloat(currentMarket.balances[token] || '0');
          if (balance < amount) {
            logger.warn({
              message: `Insufficient balance for ${token} deposit`,
              required: amount,
              available: balance,
              labels: { origin: 'LLMService' },
            });
            return false;
          }
        }

        if (action.type === 'WITHDRAW') {
          const pTokenBalance = parseFloat(currentMarket.balances[`p${token}`] || '0');
          if (pTokenBalance < amount) {
            logger.warn({
              message: `Insufficient pToken balance for ${token} withdrawal`,
              required: amount,
              available: pTokenBalance,
              labels: { origin: 'LLMService' },
            });
            return false;
          }
        }

        // Check if interest rates haven't changed significantly
        const originalRate = parseFloat(decision.marketData?.interestRates[token] || '0');
        const currentRate = parseFloat(currentMarket.interestRates[token] || '0');
        if (Math.abs(currentRate - originalRate) / originalRate > 0.1) {
          logger.warn({
            message: `Interest rate changed significantly for ${token}`,
            original: originalRate,
            current: currentRate,
            labels: { origin: 'LLMService' },
          });
          return false;
        }

        // Check liquidity for withdrawals and borrows
        if (action.type === 'WITHDRAW' || action.type === 'BORROW') {
          const availableLiquidity = parseFloat(currentMarket.liquidity[token]?.totalSupply || '0') - 
                                   parseFloat(currentMarket.liquidity[token]?.totalBorrows || '0');
          if (availableLiquidity < amount) {
            logger.warn({
              message: `Insufficient liquidity for ${token}`,
              required: amount,
              available: availableLiquidity,
              labels: { origin: 'LLMService' },
            });
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error({
        message: 'Error validating Curvance conditions',
        error: error.message,
        labels: { origin: 'LLMService' },
      });
      return false;
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

  /**
   * Retrieves decisions history
   *
   * @param {any} options - Search and pagination options
   * @returns {Promise<DecisionHistory>} - DecisionHistory.
   * @throws {HttpError} - Error if something goes wrong
   */
  public getDecisionHistory = async (
    options: any,
  ): Promise<{
    count: number;
    rows: DecisionHistory[];
  }> => {
    try {
      const search = sequelizeQueryBuilder(options, []);
      return await DecisionHistory.findAndCountAll({
        ...search,
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw new HttpError({
        message: 'Can not retrieve decision history',
        errors: error,
      });
    }
  };
}

export default LLMService;
