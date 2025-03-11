"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transformOHLCData } from "@/functions";
import { getOHLCPriceMetrics } from "@/lib/actions";
import { IQueryData, OHLCData } from "@/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function OHLCPriceMetricsChart() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<{ [k: string]: string }>({
    symbol: 'BTCUSD',
  });
  const [transformedOHLCData, setTransformedOHLCData] = useState<{ x: Date; y: number[] }[]>([]);

  // Transform the OHLC data for ApexCharts
  const series = [
    {
      data: transformedOHLCData,
    },
  ];

  // Chart options
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "candlestick",
      height: 350,
      background: "transparent", // Transparent background
      foreColor: "#ffffff", // Light text color
    },
    theme: {
      mode: "dark", // Enable dark theme
    },
    title: {
      // text: "Market Price Metrics",
      text: "",
      margin: 10,
      align: "left",
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  };

  // Handle fetch data from endpoint
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Format query params object
      const queryData: IQueryData = { ...filters };

      /** 
       * Fetch OHLC price metrics
       * It will return an object of OHLC price metrics.
       */
      const ohlcPriceMetrics = await getOHLCPriceMetrics(queryData) as OHLCData;
      console.log({ ohlcPriceMetrics });

      const transformedData = ohlcPriceMetrics ? transformOHLCData(ohlcPriceMetrics) : [];

      // Update state with fetched data
      setTransformedOHLCData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false); // Stop loader
    }
  };

  // Trigger request when filters change
  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <>
      <h3 className="text-lg font-semibold mb-6">Market Price Metrics</h3>
      <Select
        defaultValue={filters.symbol}
        onValueChange={(value) => setFilters(prev => ({ ...prev, symbol: value }))}
      >
        <SelectTrigger className="w-28 h-auto relative z-10 leading-none cursor-pointer -mb-6">
          <SelectValue placeholder="Select a symbol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BTCUSD">BTCUSD</SelectItem>
          <SelectItem value="ETHUSD">ETHUSD</SelectItem>
          <SelectItem value="SOLUSD">SOLUSD</SelectItem>
        </SelectContent>
      </Select>
      <Chart height={350} options={options} series={series} type="candlestick" />
    </>
  );
};