// Trading history
export interface ITradingHistoryData {
  id: string;
  pair: string,
  action: string,
  amountIn: string,
  expectedAmountOut: string,
  createdAt: string,
  status: string,
  price: string,
  txHash: string,
  tokenIn: string;
  tokenOut: string;
  decisionId: string;
  decision: IDecision;
  error: string | null;
  message: string;
  timestamp: string;
  updatedAt: string;
};

export interface ITradingHistoryTable {
  id: string;
  txHash: string;
  txDate: string;
  txDescription: string;
};

// Decision
export interface IDecision {
  id: string;
  decision: object;
  createdAt: string;
  updatedAt: string;
};