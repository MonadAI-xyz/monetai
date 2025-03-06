"use client";

import { getMessage } from '@/lib/actions';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useState } from 'react'
import { useAccountEffect, useSignMessage } from 'wagmi';

export const ConnectWalletButton = () => {
  const { signMessage } = useSignMessage();
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listening to wallet account lifecycle events
  useAccountEffect({
    // config,
    onConnect: async ({ address }) => {
      console.log('Account Connected!', address);
      if (!address) return;

      // Fetch message from API endpoint
      const reposnse = await getMessage();
      console.log({ getMessage: reposnse });

      // Get the message string
      const { message } = reposnse.data;

      // Sign the message
      signMessage(
        { account: address, message },
        {
          onSuccess: (signedMessage) => {
            console.log("Signed Message:", signedMessage);

            /** 
             * TODO - call backend API (via Server Action) to verify the signature/signedMessage,
             * And store ther JWT token in cookies in server action
             */
            setSignature(signedMessage); // Store the signed message
          },
          onError: (err) => {
            console.error("Signing failed:", err);
            setError("Signing failed. Please try again.");
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
  )
}
