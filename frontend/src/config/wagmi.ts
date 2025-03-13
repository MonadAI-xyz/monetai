import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  monadTestnet,
} from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'MonetAI',
  projectId: process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID,
  chains: [
    {
      ...monadTestnet,
      iconUrl: 'https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fdhc7eusqrdwa0.cloudfront.net%2Fassets%2Fmonad.png&anim=true&fit=cover&width=176&height=176',
    },
    mainnet,
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
});