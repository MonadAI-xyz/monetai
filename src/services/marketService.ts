import axios from 'axios';

export class MarketService {
  async getMarketData(): Promise<any> {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    return response.data;
  }
}