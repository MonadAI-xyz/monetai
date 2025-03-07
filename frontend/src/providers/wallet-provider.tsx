"use client";

import { darkTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import merge from 'lodash.merge';
import React from 'react';
import { WagmiProvider } from 'wagmi';

import { wagmiConfig } from '@/config/wagmi';

const queryClient = new QueryClient();

// Extending RainbowKitProvider's built-in theme
const rainbowKitCustomTheme = merge(darkTheme(), {
  colors: {
    accentColor: '#816cf9', // TODO - define color variable in tailwindcss
    // connectButtonBackground: '#816cf9',
  },
} as Theme);

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" theme={rainbowKitCustomTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
