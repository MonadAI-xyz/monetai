"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Abi, formatUnits } from "viem";
import { useAccount, useBalance, useChainId } from "wagmi";
import { readContracts } from "wagmi/actions";

import { wagmiConfig } from "@/config/wagmi";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type Token = {
  symbol: string;
  address: `0x${string}`;
};

// ERC-20 ABI (Only balanceOf & decimals)
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
] as const;

const tokens: Token[] = [
  { symbol: "USDT", address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D" },
  { symbol: "WBTC", address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d" },
  { symbol: "WETH", address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37" },
  { symbol: "WSOL", address: "0x5387C85A4965769f6B0Df430638a1388493486F1" },
];

export default function ERC20BalanceChart() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [balances, setBalances] = useState<{ symbol: string; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const walletBalance = useBalance({ address });

  console.log({ walletBalance });

  useEffect(() => {
    if (!isConnected || !address) return;
    console.log({ chainId });

    const fetchBalances = async () => {
      setLoading(true);

      try {
        // Read decimals and balances in a single batch request
        const [decimalsData, balancesData] = await Promise.all([
          readContracts(wagmiConfig, {
            // @ts-expect-error - Temporarily suppressing deep instantiation issue
            contracts: tokens.map((token) => ({
              abi: erc20Abi as Abi,
              address: token.address,
              functionName: "decimals",
            })),
          }),
          readContracts(wagmiConfig, {
            contracts: tokens.map((token) => ({
              abi: erc20Abi,
              address: token.address,
              functionName: "balanceOf",
              args: [address],
            })),
          }),
        ]);

        // Format balances
        const formattedBalances = tokens.map((token, index) => {
          const decimals = (decimalsData[index]?.result ?? 18) as number;
          const rawBalance = (balancesData[index]?.result ?? BigInt(0)) as bigint;
          return {
            symbol: token.symbol,
            balance: parseFloat(formatUnits(rawBalance, decimals)), // Convert BigInt to float
          };
        });

        // append `MON` currency balance to formatted balances
        if (walletBalance.isSuccess) {
          const { symbol, decimals, value } = walletBalance.data;

          if (symbol === 'MON') {
            formattedBalances.push({
              symbol: symbol,
              balance: parseFloat(formatUnits(value, decimals)),
            });
          }
        }

        setBalances(formattedBalances);
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address, isConnected, chainId, walletBalance.isSuccess]);

  if (!isConnected) return <div>Connect your wallet to see the balance chart.</div>;
  if (loading) return <div>Loading balances...</div>;

  // Chart options
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      background: "transparent", // Transparent background
      foreColor: "#ffffff", // Light text color
    },
    labels: balances.map((t) => t.symbol),
    theme: {
      mode: "dark", // Enable dark theme
      monochrome: {
        enabled: true,
        color: "#816cf9", // purple-500
        shadeIntensity: 0.4,
      },
    },
  };

  const chartSeries = balances.map((t) => t.balance);

  return (
    <div>
      <h2 className="text-lg font-bold">Token Balances</h2>
      <Chart height={350} options={chartOptions} series={chartSeries} type="donut" />
    </div>
  );
};
