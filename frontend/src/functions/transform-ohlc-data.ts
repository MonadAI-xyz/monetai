import { OHLCData } from "@/types";

/** 
 * Transform the OHLC Data for ApexCharts
 * 
 * The OHLC data which received from the API needs to be transformed into 
 * the format required by ApexCharts.
 * ApexCharts expects an array of objects where each object represents a 
 * candlestick with x (timestamp) and y (OHLC values).
 * 
 * @param ohlcData Object
 * @returns Array
 */
export const transformOHLCData = (ohlcData: OHLCData) => {
  return ohlcData.t.map((timestamp, index) => ({
    x: new Date(timestamp * 1000), // Convert Unix timestamp to JavaScript Date
    y: [
      ohlcData.o[index], // Open
      ohlcData.h[index], // High
      ohlcData.l[index], // Low
      ohlcData.c[index], // Close
    ],
  }));
};