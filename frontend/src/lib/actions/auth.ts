"use server";

import { fetchWrapper } from "../fetch-wrapper";

// Get the message
export const getMessage = async () => {
  // Send request
  const response = await fetchWrapper('/auth/message', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}