import axios from 'axios';
import { logger } from '@utils/logger';

export interface MarketDataParams {
  from: number;
  to: number;
  resolution: '1' | '2' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '720' | 'D' | '1D' | 'W' | '1W' | 'M' | '1M';
  symbol: string;
}

export interface MarketDataResponse {
  s?: string;
  t: number[];  // timestamps
  c?: number[]; // close prices
  o?: number[]; // open prices
  h?: number[]; // high prices
  l?: number[]; // low prices
  v?: number[]; // volumes
  status?: string;
  errmsg?: string;
}

export const TRADING_PAIRS = [
  'BTCUSD', 'ETHUSD', 'LTCUSD', 'BNBUSD', 'XRPUSD',
  'ADAUSD', 'SOLUSD', 'DOTUSD', 'MATICUSD', 'DOGEUSD'
];

class MarketDataService {
  private readonly baseUrl = 'https://rest.jp.stork-oracle.network/v1';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.STORK_API_KEY;
  }

  async getAllPairsData(params: Omit<MarketDataParams, 'symbol'>): Promise<Record<string, MarketDataResponse>> {
    const results: Record<string, MarketDataResponse> = {};
    
    await Promise.all(
      TRADING_PAIRS.map(async (symbol) => {
        try {
          const data = await this.getMarketData({ ...params, symbol });
          
          // Check if response indicates an error
          if (data.s === 'error' || data.status === 'error') {
            throw new Error(data.errmsg || 'API returned error status');
          }
          
          // Store the data even if some fields are missing
          results[symbol] = data;
        } catch (error) {
          logger.error({ 
            message: `Error fetching market data for ${symbol}: ${error.message}`, 
            labels: { origin: 'MarketDataService' } 
          });
          // Add empty but valid structure for failed requests
          results[symbol] = {
            s: "error",
            t: [],
            c: [],
            o: [],
            h: [],
            l: [],
            v: []
          };
        }
      })
    );

    // Ensure we got at least some data
    const validPairs = Object.entries(results).filter(([_, data]) => 
      data.t && data.t.length > 0 && data.c && data.c.length > 0
    );

    if (validPairs.length === 0) {
      throw new Error('Failed to fetch valid data for any trading pair');
    }

    return results;
  }

  async getMarketData(params: MarketDataParams): Promise<MarketDataResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('STORK_API_KEY is not configured');
      }

      const response = await axios.get(`${this.baseUrl}/tradingview/history`, {
        params,
        headers: {
          'Authorization': `Basic ${this.apiKey.trim()}`,
        },
      });

      // Log the raw response for debugging
      logger.debug({ 
        message: 'Raw API response',
        data: response.data,
        labels: { origin: 'MarketDataService' }
      });

      // Basic validation - just ensure we have timestamps
      if (!response.data || !response.data.t || !Array.isArray(response.data.t)) {
        throw new Error(`Invalid response structure from API: missing timestamps`);
      }

      // Return all available data
      return {
        s: response.data.s,
        t: response.data.t,
        c: response.data.c || [],
        o: response.data.o || [],
        h: response.data.h || [],
        l: response.data.l || [],
        v: response.data.v || [],
        status: response.data.status,
        errmsg: response.data.errmsg
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error({ 
          message: `API request failed: ${error.message}`,
          status: error.response?.status,
          data: error.response?.data,
          params,
          labels: { origin: 'MarketDataService' }
        });
      }
      throw error;
    }
  }
}

export default MarketDataService; 