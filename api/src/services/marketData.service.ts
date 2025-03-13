import BaseService from '@services/baseService.service';
import config from '@config';
import axios from 'axios';
import { logger } from '@utils/logger';
import { HttpBadRequest } from '@exceptions/http/HttpBadRequest';

export interface MarketDataParams {
  from: number;
  to: number;
  resolution: '1' | '2' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '720' | 'D' | '1D' | 'W' | '1W' | 'M' | '1M';
  symbol?: string; // Make optional since we'll fetch all pairs by default
}

export interface MarketDataResponse {
  s?: string;
  t: number[]; // timestamps
  c?: number[]; // close prices
  o?: number[]; // open prices
  h?: number[]; // high prices
  l?: number[]; // low prices
  v?: number[]; // volumes
  status?: string;
  errmsg?: string;
}

export const TRADING_PAIRS = ['BTCUSD', 'ETHUSD', 'SOLUSD'] as const;
export type TradingPair = typeof TRADING_PAIRS[number];

class MarketDataService extends BaseService {
  private readonly baseUrl = config.ai.stork.baseUrl;
  private readonly apiKey = config.ai.stork.apiKey;

  public async getAllPairsData(params: Omit<MarketDataParams, 'symbol'>): Promise<Record<TradingPair, MarketDataResponse>> {
    const results: Partial<Record<TradingPair, MarketDataResponse>> = {};

    await Promise.all(
      TRADING_PAIRS.map(async symbol => {
        try {
          const data = await this.getMarketData({ ...params, symbol });

          if (data.s === 'error' || data.status === 'error') {
            throw new HttpBadRequest(data.errmsg || 'API returned error status');
          }

          results[symbol] = data;
        } catch (error) {
          logger.error({
            message: `Error fetching market data for ${symbol}: ${error.message}`,
            labels: { origin: 'MarketDataService' },
          });
          results[symbol] = this.getEmptyResponse();
        }
      }),
    );

    const validPairs = Object.entries(results).filter(([_, data]) => data.t && data.t.length > 0 && data.c && data.c.length > 0);

    if (validPairs.length === 0) {
      throw new HttpBadRequest('Failed to fetch valid data for any trading pair');
    }

    return results as Record<TradingPair, MarketDataResponse>;
  }

  public async getMarketData(params: MarketDataParams): Promise<MarketDataResponse> {
    try {
      if (!this.apiKey) {
        throw new HttpBadRequest('Stork API key is not configured');
      }

      const response = await axios.get(`${this.baseUrl}/tradingview/history`, {
        params,
        headers: {
          Authorization: `Basic ${this.apiKey.trim()}`,
        },
      });

      if (!response.data || !response.data.t || !Array.isArray(response.data.t)) {
        throw new HttpBadRequest('Invalid response structure from API');
      }

      return this.formatResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error({
          message: `API request failed: ${error.message}`,
          status: error.response?.status,
          data: error.response?.data,
          params,
          labels: { origin: 'MarketDataService' },
        });
      }
      throw error;
    }
  }

  private formatResponse(data: any): MarketDataResponse {
    return {
      s: data.s,
      t: data.t,
      c: data.c || [],
      o: data.o || [],
      h: data.h || [],
      l: data.l || [],
      v: data.v || [],
      status: data.status,
      errmsg: data.errmsg,
    };
  }

  private getEmptyResponse(): MarketDataResponse {
    return {
      s: 'error',
      t: [],
      c: [],
      o: [],
      h: [],
      l: [],
      v: [],
    };
  }
}

export default MarketDataService;
