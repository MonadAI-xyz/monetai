"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { Skeleton } from "../ui/skeleton";

export type Token = {
  symbol: string;
  address: `0x${string}`;
};

// ERC20 ABI format
const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
];

const ERC20BalanceChecker = ({ token }: { token: Token }) => {
  const { address, isConnected } = useAccount();
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);

  // Fetch Token Decimals
  const { data: decimals, isLoading: loadingDecimals } = useReadContract(
    isConnected ? {
      abi: erc20Abi,
      address: token.address,
      functionName: "decimals",
    } : {}
  );

  // Fetch Token Balance
  const { data: balance, isLoading: loadingBalance, error } = useReadContract(
    address ? {
      abi: erc20Abi,
      address: token.address,
      functionName: "balanceOf",
      args: [address], // Pass the user's address
      query: {
        refetchInterval: 10000, // Poll every 10 sec
        // Continue to refetch while tab/window is in the background
        refetchIntervalInBackground: true,
      },
    } : {}
  );

  console.log({ isConnected, balance, decimals, formattedBalance, error })

  // Format Balance when data is available
  useEffect(() => {
    if (typeof balance === "bigint" && typeof decimals === "number") {
      setFormattedBalance(formatUnits(balance, decimals));
    } else {
      setFormattedBalance(null); // Reset if undefined
    }
  }, [balance, decimals]);

  // Return if account not connected
  if (!isConnected) return <div>Connect your wallet to see the balance.</div>;

  return (
    <>
      {loadingBalance || loadingDecimals ? (
        <Skeleton className="h-4 rounded-sm" />
      ) : formattedBalance !== null ? (
        <span>
          <strong>{token.symbol}:</strong> {formattedBalance} Tokens
        </span>
      ) : (
        <span>Could not fetch balance.</span>
      )}
    </>
  );
};

export default ERC20BalanceChecker;