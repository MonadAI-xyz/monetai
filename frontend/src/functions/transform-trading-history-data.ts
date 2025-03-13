import {ITradingHistoryData, ITradingHistoryTable} from '@/types';

// Transform the data for data table
export const transformTradingHistoryData = (
    data: ITradingHistoryData[]
): ITradingHistoryTable[] => {
    return data.map((trade) => {
        const [tokenOut, tokenIn] = trade.pair.split("_"); // Split the pair into tokenOut and tokenIn
        // Generate description
        const txDescription = `${trade.action} ${trade.expectedAmountOut} ${tokenOut} for ${trade.amountIn} ${tokenIn ?? 'USD'}.`;

        return {
            id: trade.id,
            txDate: trade.createdAt,
            txDescription,
            txHash: trade.txHash || '-',
            status: trade.status || "-"
        };
    });
}