'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ComponentProps } from 'react';

import WalletProvider from '@/providers/wallet-provider';

export const Providers = ({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) => {
  return (
    <NextThemesProvider {...props}>
      <WalletProvider>
        {children}
      </WalletProvider>
    </NextThemesProvider>
  );
};
