import { Metadata, Viewport } from 'next';
import type { PropsWithChildren } from 'react';

import { Providers } from '@/app/providers';
import { CoreLayout } from '@/components/core-layout';
import { Toaster } from '@/components/ui/sonner';
import { inter } from '@/fonts';
import { cn } from '@/functions/cn';

import '@/styles/main.css';

export const viewport: Viewport = {
  themeColor: 'black',
};

export const metadata: Metadata = {
  title: 'Your App Name | Home',
  description: 'Your app description',
  metadataBase: new URL('https://google.com'),
  openGraph: {
    title: 'Your App Name',
    description: 'Your app description',
    url: 'https://google.com',
    siteName: 'Your App Name',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@username',
    creator: '@username',
  },
};

const GlobalLayout = ({ children }: PropsWithChildren) => {
  return (
    <html suppressHydrationWarning className={cn(inter.variable)} lang="en">
      <meta content="app" name="apple-mobile-web-app-title" />
      <body>
        <Providers
          disableTransitionOnChange
          enableSystem
          attribute="class"
          defaultTheme="system"
        >
          <CoreLayout>{children}</CoreLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
};

export default GlobalLayout;
