export interface TradeLog {
  timestamp: string;
  action: 'BUY' | 'SELL';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  txHash: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
} 