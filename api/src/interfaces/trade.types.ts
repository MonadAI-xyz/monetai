export interface TradeLog {
  timestamp: Date;
  pair: string;
  action: 'BUY' | 'SELL';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  txHash: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
  decisionId?: string;
}
