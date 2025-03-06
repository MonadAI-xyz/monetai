"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useState } from 'react'
import { useAccountEffect, useSignMessage } from 'wagmi';

export const ConnectWalletButton = () => {
  const { signMessage } = useSignMessage();
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  // TODO - move all wallets logic to a `/components/wallet/` folder
  // Listening to wallet account lifecycle events
  useAccountEffect({
    // config,
    onConnect: ({ address }) => {
      console.log('Account Connected!', address);
      if (!address) return;

      // User's wallet data
      // const { address } = data;

      // TODO - fetch message from API endpoint
      const message = "Sign in to continue";

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
