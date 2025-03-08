import { ITradingHistoryData, ITradingHistoryTable } from '@/types';

// Transform the data for data table
export const transformTradingHistoryData = (
  data: ITradingHistoryData[]
): ITradingHistoryTable[] => {
  return data.map((trade) => {
    const [tokenOut, tokenIn] = trade.pair.split("_"); // Split the pair into tokenOut and tokenIn
    // Generate description
    const txDescription = `${trade.action} ${trade.amountIn} ${tokenOut} for ${trade.expectedAmountOut} ${tokenIn}.`;

    return {
      id: trade.id,
      txDate: trade.createdAt,
      txDescription,
      txHash: trade.txHash || '-',
    };
  });
}