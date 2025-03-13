"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Cookies from 'js-cookie';
import React from 'react'
import { useAccountEffect, useSignMessage } from 'wagmi';

import { getMessage, verifySignedMessage } from '@/lib/actions';

export const ConnectWalletButton = () => {
  const { signMessage } = useSignMessage();

  // Listening to wallet account lifecycle events
  useAccountEffect({
    // config,
    onConnect: async ({ address }) => {
      console.log('Account Connected!', address);
      if (!address) return;

      const authToken = Cookies.get("authToken");
      if (authToken) return;

      // Fetch message from API endpoint
      const reposnse = await getMessage();
      // console.log({ getMessage: reposnse });

      // Get the message string
      const { message } = reposnse.data;
      console.log({ message });

      // Sign the message
      signMessage(
        {
          account: address,
          message,
        },
        {
          onSuccess: async (signedMessage) => {
            console.log("Signed Message:", signedMessage);

            // Verify the signature/signedMessage
            const response = await verifySignedMessage(address, signedMessage);
            console.log({ verifySignedMessage: response });
          },
          onError: (err) => {
            console.error("Signing failed:", err);
          },
        }
      );
    },
    onDisconnect() {
      console.log('Disconnected!')
    },
  });

  return (
    <ConnectButton />
  );
}
