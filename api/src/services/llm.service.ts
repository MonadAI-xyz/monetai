import BaseService from '@services/baseService.service';
import config from '@config';
import { OpenAI } from 'openai';
import { logger } from '@utils/logger';
import MarketDataService, { MarketDataParams, MarketDataResponse, TRADING_PAIRS, TradingPair } from './marketData.service';
import { getTimeRanges, timestampToDate } from '@utils/time';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';
import TradingService from '@services/trading.service';
import { DecisionHistory } from '@models';
import _ from 'lodash';
import { sequelizeQueryBuilder } from '@utils/utils';
import { HttpError } from '@exceptions/http/HttpError';
import CurvanceService from './curvance.service';
import XService from '@services/x.service';

class LLMService extends BaseService {
  private openai: OpenAI;
  private deepseek: OpenAI;
  private marketDataService: MarketDataService | null = null;
  private tradingService: TradingService | null = null;
  private curvanceService: CurvanceService | null = null;
  private xService: XService | null = null;
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

    // If one model fails, use the other one with medium confidence
    if (gptResult.status === 'rejected') {
      const decision = deepseekResult.value;
      return {
        ...decision,
        reasoning: {
          ...decision.reasoning,
          marketCondition: `Model 2 Only: ${decision.reasoning.marketCondition}`,
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
          marketCondition: `Model 1 Only: ${decision.reasoning.marketCondition}`,
        },
        confidence: 'MEDIUM',
      };
    }

    // Both models responded successfully
    const gptDecision = gptResult.value;
    const deepseekDecision = deepseekResult.value;

    // If both agree on action and pair, merge their decisions
    if (gptDecision.action === deepseekDecision.action && gptDecision.pair === deepseekDecision.pair) {
      return {
        action: gptDecision.action,
        pair: gptDecision.pair,
        shouldExecute: gptDecision.action === 'BUY' || gptDecision.action === 'SELL',
        reasoning: {
          marketCondition: `All Models Agree: ${gptDecision.reasoning.marketCondition}`,
          technicalAnalysis: `Consensus: ${gptDecision.reasoning.technicalAnalysis}`,
          riskAssessment: this.combineRiskAssessments(gptDecision?.reasoning?.riskAssessment, deepseekDecision?.reasoning?.riskAssessment),
          pairSelection: gptDecision.reasoning.pairSelection,
          comparativeAnalysis: {
            ...gptDecision.reasoning.comparativeAnalysis,
            modelAgreement: 'Both models agree on pair selection and action',
          },
        },
        confidence: 'HIGH',
      };
    }

    // If they disagree, take the conservative approach
    return {
      action: 'WAIT',
      pair: null,
      shouldExecute: false,
      reasoning: {
        marketCondition: 'Mixed signals between Models',
        technicalAnalysis: `Model 1 suggests ${gptDecision.action} ${gptDecision.pair}, Model 2 suggests ${deepseekDecision.action} ${deepseekDecision.pair}`,
        riskAssessment: 'HIGH due to model disagreement',
        pairSelection: 'Models disagree on pair selection',
        comparativeAnalysis: {
          volatilityComparison: 'Analysis suspended due to model disagreement',
          trendAlignment: 'Models show different interpretations',
          relativeStrength: 'No consensus on strongest pair',
          modelAgreement: 'Models disagree on best trading opportunity',
        },
      },
      confidence: 'LOW',
    };
  }

  private async getModelDecision(client: OpenAI, model: string, data: any) {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional crypto trading advisor analyzing BTC/USD, ETH/USD, and SOL/USD pairs. You must assess market conditions using technical indicators, price action, and sentiment analysis. Respond with ONLY raw JSON, no markdown or code blocks.`,
        },
        {
          role: 'user',
          content: `Analyze these trading pairs and recommend the best trading opportunity if any:
                   Data: ${JSON.stringify(data)}

                   Consider the following factors in your analysis:
                   
                   1. Technical Indicators:
                   - Moving Averages (50/200 EMA)
                   - Relative Strength Index (RSI)
                   - MACD
                   - Bollinger Bands
                   - Volume Trends
                   
                   2. Price Action & Trend Analysis:
                   - Support/Resistance Levels
                   - Breakouts/Reversals
                   - Trend Strength
                   - Price Patterns
                   
                   3. Cross-Pair Analysis:
                   - Correlations
                   - Relative Strength
                   - Market Regime
                   - Leading/Lagging Pairs

                   4. Risk Assessment:
                   - Volatility Levels
                   - Stop-Loss Placement
                   - Position Sizing
                   - Market Depth

                   Return ONLY this JSON structure (no markdown):
                   {
                     "action": "BUY" | "SELL" | "WAIT",
                     "pair": "BTC_USD" | "ETH_USD" | "SOL_USD",
                     "reasoning": {
                       "marketCondition": "brief state of the chosen market",
                       "technicalAnalysis": "key technical factors",
                       "riskAssessment": "risk level and considerations",
                       "pairSelection": "why this pair was chosen over others",
                       "comparativeAnalysis": {
                         "volatilityComparison": "volatility across pairs",
                         "trendAlignment": "how trends align/diverge",
                         "relativeStrength": "strongest setup and why",
                         "correlationImpact": "how correlations affect the decision"
                       }
                     }
                   }`,
        },
      ],
      model: model,
      temperature: 0.2,
      max_tokens: 500,
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
      const marketDataParams = {
        from: params?.from || timeRanges.from,
        to: params?.to || timeRanges.to,
        resolution: params?.resolution || '240',
      };

      // Get market data for all pairs and Curvance
      const [tradingMarketData, curvanceMarketData] = await Promise.all([
        this.marketDataService.getAllPairsData(marketDataParams),
        this.curvanceService.getMarketData(),
      ]);

      // Calculate indicators for all pairs
      const tradingIndicators = this.calculateIndicatorsForAllPairs(tradingMarketData);

      // Get trading decision across all pairs
      const tradingDecision = await this.getCollectiveDecision(tradingIndicators);

      // Get Curvance decision
      const curvanceDecision = await this.getAIDecision({
        trading: tradingMarketData,
        lending: curvanceMarketData,
      });

      // Execute both decisions if needed
      const executions = await Promise.allSettled([
        // Execute trade if shouldExecute is true and we have a valid pair
        tradingDecision.shouldExecute && tradingDecision.pair ? this.handleTradeSignal(tradingDecision) : Promise.resolve(),

        // Execute Curvance actions if shouldExecute is true
        curvanceDecision.shouldExecute && curvanceDecision.actions?.length > 0
          ? this.executeCurvanceDecision(curvanceDecision, curvanceMarketData)
          : Promise.resolve(),
      ]);
      const finalDecision = {
        decision: {
          trading: tradingDecision,
          curvance: {
            ...curvanceDecision,
            executionResults: executions[1].status === 'fulfilled' ? executions[1].value : null,
          },
        },
      };
      try {
        const msg = await this.generateTradingSummary(finalDecision);
        console.log('X msg: ', msg);
        await this.xService.postToX(msg);
      } catch (e) {
        logger.error('X error', e);
      }
      // Save combined decision history
      const decisionHistory = await DecisionHistory.create(finalDecision);

      return {
        timestamp: new Date().toISOString(),
        indicators: {
          trading: tradingIndicators,
          lending: this.formatLendingMetrics(curvanceMarketData),
        },
        recommendations: {
          trading: {
            ...tradingDecision,
            id: decisionHistory.id,
          },
          curvance: {
            ...curvanceDecision,
            id: decisionHistory.id,
          },
        },
      };
    } catch (error) {
      logger.error({
        message: `Error in LLM service: ${error.message}`,
        labels: { origin: 'LLMService' },
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
          prompt,
        }),
        this.getModelDecision(this.deepseek, config.ai.deepseek.model, {
          lending: lendingMetrics,
          prompt,
        }),
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
          yieldStrategy: 'No strategy due to error',
        },
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
            riskAssessment: 'HIGH',
          },
        };
      }

      // Parse successful responses
      const gptDecision =
        gptResult.status === 'fulfilled' ? (typeof gptResult.value === 'string' ? JSON.parse(gptResult.value) : gptResult.value) : null;
      const deepseekDecision =
        deepseekResult.status === 'fulfilled'
          ? typeof deepseekResult.value === 'string'
            ? JSON.parse(deepseekResult.value)
            : deepseekResult.value
          : null;

      // If one model fails, use the other with medium confidence
      if (!gptDecision) {
        return {
          ...deepseekDecision,
          confidence: 'MEDIUM',
          actions: deepseekDecision.actions || [],
          shouldExecute: false,
        };
      }

      if (!deepseekDecision) {
        return {
          ...gptDecision,
          confidence: 'MEDIUM',
          actions: gptDecision.actions || [],
          shouldExecute: false,
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
            marketAnalysis: `Both Models Agree: ${gptDecision.reasoning.marketCondition || gptDecision.reasoning.marketAnalysis}`,
            riskAssessment: gptDecision.reasoning.riskAssessment,
          },
          // Ensure actions array exists
          actions: [...(gptDecision.actions || []), ...(deepseekDecision.actions || [])].map(action => ({
            ...action,
            amount: action?.amount?.toString() || '0',
            recipient: action?.recipient || this.wallet.address,
          })),
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
          riskAssessment: 'HIGH due to model disagreement',
        },
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
          riskAssessment: 'HIGH',
        },
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
        acc[token] = ((parseFloat(totalBorrows) / parseFloat(totalSupply)) * 100).toFixed(2) + '%';
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
              result = await this.curvanceService.depositFunds(action.amount, action.token);
              break;

            case 'WITHDRAW':
              result = await this.curvanceService.withdrawFunds(action.amount, action.token, action.recipient || this.wallet.address);
              break;

            case 'BORROW':
              result = await this.curvanceService.borrowFunds(action.amount, action.token, action.recipient || this.wallet.address);
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
            id: decision.id,
          },
        },
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
          const availableLiquidity =
            parseFloat(currentMarket.liquidity[token]?.totalSupply || '0') - parseFloat(currentMarket.liquidity[token]?.totalBorrows || '0');
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

  async handleTradeSignal(decision: any) {
    try {
      if (!decision.action || !['BUY', 'SELL'].includes(decision.action) || !decision.pair) {
        logger.info('No valid trade action needed');
        return null;
      }

      const action = decision.action.toLowerCase() as 'buy' | 'sell';
      const pair = decision.pair.replace('_', '');

      // Check if trade is viable before proceeding
      const viability = await this.tradingService.checkTradeViability(action, pair);
      if (!viability.viable) {
        logger.warn({
          message: 'Trade not viable',
          reason: viability.reason,
          balance: viability.balance,
          token: viability.token,
          action,
          pair,
          labels: { origin: 'LLMService' },
        });
        return null;
      }

      const riskLevel = this.assessRiskLevel(decision.reasoning.riskAssessment);

      try {
        const amount = await this.tradingService.calculateTradeAmount(action, riskLevel, pair);
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
        message: `Error executing trade: ${error.message}`,
        decision,
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

  private calculateIndicatorsForAllPairs(marketData: Record<TradingPair, MarketDataResponse>) {
    const indicators = {} as Record<TradingPair, any>;

    for (const [pair, data] of Object.entries(marketData)) {
      indicators[pair] = this.calculateIndicators(data);
    }

    // Add cross-pair analysis
    const crossPairAnalysis = this.calculateCrossPairMetrics(marketData);

    return {
      pairs: indicators,
      crossPairAnalysis,
    };
  }

  private calculateCrossPairMetrics(marketData: Record<TradingPair, MarketDataResponse>) {
    try {
      const correlations: Record<string, number> = {};
      const relativeStrength: Record<string, number> = {};
      const volatilityRank: Record<string, number> = {};

      // Calculate correlations between pairs
      for (let i = 0; i < TRADING_PAIRS.length; i++) {
        for (let j = i + 1; j < TRADING_PAIRS.length; j++) {
          const pair1 = TRADING_PAIRS[i];
          const pair2 = TRADING_PAIRS[j];

          const returns1 = this.calculateReturns(marketData[pair1].c || []);
          const returns2 = this.calculateReturns(marketData[pair2].c || []);

          correlations[`${pair1}_${pair2}`] = this.calculateCorrelation(returns1, returns2);
        }
      }

      // Calculate relative strength (using last 24h performance)
      for (const pair of TRADING_PAIRS) {
        const prices = marketData[pair].c || [];
        const dailyChange = this.calculatePriceChange(prices, 6); // 6 4-hour periods = 1 day
        relativeStrength[pair] = dailyChange;
      }

      // Rank pairs by volatility
      const volatilities = TRADING_PAIRS.map(pair => ({
        pair,
        volatility: this.calculateVolatility(this.calculateReturns(marketData[pair].c || [])),
      }));

      volatilities.sort((a, b) => b.volatility - a.volatility);
      volatilities.forEach((v, i) => {
        volatilityRank[v.pair] = i + 1;
      });

      return {
        correlations,
        relativeStrength,
        volatilityRank,
        strongestTrend: this.findStrongestTrend(marketData),
        marketRegime: this.determineMarketRegime(marketData),
      };
    } catch (error) {
      logger.error({
        message: 'Error calculating cross-pair metrics',
        error: error.message,
        labels: { origin: 'LLMService' },
      });
      return {
        correlations: {},
        relativeStrength: {},
        volatilityRank: {},
        strongestTrend: null,
        marketRegime: 'UNKNOWN',
      };
    }
  }

  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    if (n < 2) return 0;

    const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    const variance1 = returns1.slice(0, n).reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
    const variance2 = returns2.slice(0, n).reduce((a, b) => a + Math.pow(b - mean2, 2), 0);

    const covariance = returns1.slice(0, n).reduce((a, b, i) => a + (b - mean1) * (returns2[i] - mean2), 0);

    return covariance / Math.sqrt(variance1 * variance2);
  }

  private findStrongestTrend(marketData: Record<TradingPair, MarketDataResponse>): string | null {
    let strongestTrend = null;
    let maxTrendStrength = 0;

    for (const [pair, data] of Object.entries(marketData)) {
      const prices = data.c || [];
      const sma20 = this.calculateSMA(prices, 20);
      const sma50 = this.calculateSMA(prices, 50);
      const momentum = Math.abs(this.calculateMomentum(prices, 14));

      const trendStrength = momentum * (sma20 > sma50 ? 1 : -1);

      if (Math.abs(trendStrength) > Math.abs(maxTrendStrength)) {
        maxTrendStrength = trendStrength;
        strongestTrend = pair;
      }
    }

    return strongestTrend;
  }

  private determineMarketRegime(marketData: Record<TradingPair, MarketDataResponse>): 'RISK_ON' | 'RISK_OFF' | 'MIXED' | 'UNKNOWN' {
    try {
      let riskOnCount = 0;
      let riskOffCount = 0;

      for (const data of Object.values(marketData)) {
        const prices = data.c || [];
        const rsi = this.calculateRSI(prices, 14);
        const volatility = this.calculateVolatility(this.calculateReturns(prices));
        const momentum = this.calculateMomentum(prices, 14);

        if (rsi > 50 && momentum > 0 && volatility < 0.02) {
          riskOnCount++;
        } else if (rsi < 50 && momentum < 0) {
          riskOffCount++;
        }
      }

      if (riskOnCount > TRADING_PAIRS.length / 2) return 'RISK_ON';
      if (riskOffCount > TRADING_PAIRS.length / 2) return 'RISK_OFF';
      return 'MIXED';
    } catch (error) {
      return 'UNKNOWN';
    }
  }

  public generateTradingSummary = async (tradingData: object): Promise<string> => {
    const prompt = `
Summarize the following trading data in a concise X post (max 230 characters). Ensure the structure follows this format:

🚨 Trading Update 🚨  
📉 Action: [ACTION] – [MARKET SIGNALS]. [RISK FACTORS].  
🤖 Insights: 🔹 [KEY INSIGHT 1] 🔹 [KEY INSIGHT 2] 🔹 [KEY INSIGHT 3]  
⚠️ Confidence: [CONFIDENCE] → [EXECUTION DECISION]  

#Crypto #Trading #MarketAnalysis  

**Limit response to 230 characters.**  

Trading Data: ${JSON.stringify(tradingData, null, 2)}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that creates concise trading summaries for X posts, ensuring they do not exceed 230 characters.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating trading summary:', error);
      return null;
    }
  };
}

export default LLMService;
