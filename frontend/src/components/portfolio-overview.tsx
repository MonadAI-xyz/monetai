"use client";

import React from 'react'
import { useAccount } from 'wagmi';

import ERC20BalanceChecker, { Token } from './wallet/token-balance';

const tokens: Token[] = [
  { symbol: "USDT", address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D" },
  { symbol: "WBTC", address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d" },
  { symbol: "WETH", address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37" },
  { symbol: "WSOL", address: "0x5387C85A4965769f6B0Df430638a1388493486F1" },
];

export default function PortfolioOverview() {
  const { isConnected } = useAccount();

  return (
    <>
      <h3 className="text-lg font-semibold mb-6">Portfolio Overview</h3>

      {isConnected ?
        <ul className="space-y-2">
          {tokens.map(token => (
            <li key={token.symbol}>
              <ERC20BalanceChecker token={token} />
            </li>
          ))}
        </ul>
        : <p>Connect your wallet to see the balance.</p>
      }
    </>
  )
}
