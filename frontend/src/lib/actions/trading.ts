"use server";

import { fetchWrapper } from "../fetch-wrapper";

// Get trading history
export const getTradingHistory = async () => {
  // Send request
  const response = await fetchWrapper('/trading/history', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}
