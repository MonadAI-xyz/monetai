"use server";

import { generateQueryParamsString } from "@/functions";
import { IQueryData, ITradingHistoryData } from "@/types";

import { fetchWrapper } from "../fetch-wrapper";

type TradingHistoryResponse = {
  count: number; // Total number of records
  rows: Array<ITradingHistoryData>;
};

// Get trading history
export const getTradingHistory = async () => {
  // Send request
  const response = await fetchWrapper<TradingHistoryResponse>('/api/trading/history', {
    method: "GET",
  });

  return response;
}

// Get decisions
export const getDecisions = async () => {
  // Send request
  const response = await fetchWrapper<TradingHistoryResponse>('/api/llms/decisions', {
    method: "GET",
    next: {
      revalidate: 0, // revalidate caches immediately
    },
  });

  return response;
}

// Get OHLC price data for a specific asset within a time range
export const getOHLCPriceMetrics = async (queryData: IQueryData) => {
  const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
  const oneWeekAgo = now - (7 * 24 * 60 * 60); // 7 days ago in seconds
  console.log({oneWeekAgo});

  const params = {
    from: oneWeekAgo, // Unix timestamp in seconds
    to: now,
    resolution: 60,
    symbol: queryData.symbol,
  };

  // Get query params string
  const queryParams = generateQueryParamsString(params);

  // Send request
  const response = await fetchWrapper(`/v1/tradingview/history${queryParams}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${process.env.STORK_API_KEY}`,
    },
    baseUrl: process.env.STORK_API_BASE_URL,
  });

  return response;
}
