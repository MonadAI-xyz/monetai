// import { Metadata } from 'next';

// import { AppSidebar } from '@/components/app-sidebar';
import OHLCPriceMetricsChart from '@/components/charts/ohlc-price-metrics-chart';
import Header from '@/components/header';
import { columns, DataTable } from '@/components/ui/data-table';
import { transformTradingHistoryData } from '@/functions/transform-trading-history-data';
import { getOHLCPriceMetrics, getTradingHistory } from '@/lib/actions';
import { OHLCData } from '@/types';

// import {
//   SidebarInset,
//   SidebarProvider,
// } from '@/components/ui/sidebar';

// export const metadata: Metadata = {
//   title: "Home",
// };

export default async function Page() {
  const response = await getTradingHistory();
  // console.log({ getTradingHistory: response });

  // Tranform the fetched data if sxists, otherwise fallback to static data
  const transformedData = response?.data?.count > 0
    ? transformTradingHistoryData(response.data.rows)
    : [];

  // Fetch OHLC price metrics
  const ohlcPriceMetrics = await getOHLCPriceMetrics() as OHLCData;
  // console.log({ ohlcPriceMetrics })

  return (
    // <SidebarProvider>
    // <AppSidebar />
    // <SidebarInset>
    <main className="bg-background relative flex min-h-svh flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 rounded-xl p-4">Portfolio Overview</div>
          <div className="bg-muted/50 rounded-xl p-4">DAO GOV - Active proposals</div>
          <div className="bg-muted/50 rounded-xl p-4">
            <OHLCPriceMetricsChart ohlcData={ohlcPriceMetrics} />
          </div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl p-4 md:min-h-min">
          <DataTable columns={columns} data={transformedData} />
        </div>
      </div>
    </main>
    // </SidebarInset>
    // </SidebarProvider>
  );
}
