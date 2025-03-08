"use client";

import dynamic from "next/dynamic";
import React from "react";

import { transformOHLCData } from "@/functions";
import { OHLCData } from "@/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type OHLCPriceMetricsChartProps = {
  ohlcData: OHLCData;
};

const OHLCPriceMetricsChart: React.FC<OHLCPriceMetricsChartProps> = ({ ohlcData }) => {
  // Transform the OHLC data for ApexCharts
  const series = [
    {
      data: transformOHLCData(ohlcData),
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
      text: "Market Price Metrics",
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

  return (
    <div>
      <Chart height={350} options={options} series={series} type="candlestick" />
    </div>
  );
};

export default OHLCPriceMetricsChart;