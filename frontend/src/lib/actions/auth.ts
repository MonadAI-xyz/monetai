"use server";

import { fetchWrapper } from "../fetch-wrapper";
import { createSession } from "../session";

type GetMessageResponse = {
  message: string;
};

type VerifySignedMessageResponse = {
  token: string;
};

// Get the message
export const getMessage = async () => {
  // Send request
  const response = await fetchWrapper<GetMessageResponse>('/api/auth/message', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}

// Verify the signed message
export const verifySignedMessage = async (address: string, signedMessage: string) => {
  // Prepare request data
  const requestData = {
    walletAddress: address,
    signature: signedMessage,
  }

  // Send request
  const response = await fetchWrapper<VerifySignedMessageResponse>('/api/auth/verify', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.data.token) throw new Error("Invalid API response: Token is missing.");

  // Store token in cookie
  await createSession(response.data.token);

  return response;
}