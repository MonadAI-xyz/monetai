// import { Metadata } from 'next';

// import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import { columns, DataTable } from '@/components/ui/data-table';
import { getTradingHistory } from '@/lib/actions';
import { ITradingHistoryData, ITradingHistoryTable } from '@/types';
// import {
//   SidebarInset,
//   SidebarProvider,
// } from '@/components/ui/sidebar';

// export const metadata: Metadata = {
//   title: "Home",
// };

// Transform the data for data table
const transformTradingHistoryData = (data: ITradingHistoryData[]): ITradingHistoryTable[] => {
  return data.map((trade) => {
    const [tokenOut, tokenIn] = trade.pair.split("_"); // Split the pair into tokenOut and tokenIn
    // Generate description
    const txDescription = `${trade.action} ${trade.amountIn} ${tokenOut} for ${trade.expectedAmountOut} ${tokenIn}.`;

    return {
      id: trade.id,
      txDate: trade.createdAt,
      txDescription,
      txHash: trade.txHash || '-',
    };
  });
}

export default async function Page() {
  const response = await getTradingHistory();
  console.log({ getTradingHistory: response });

  // Tranform the fetched data if sxists, otherwise fallback to static data
  const transformedData = response.data.count > 0
    ? transformTradingHistoryData(response.data.rows)
    : [];

  console.log({ transformedData });

  return (
    // <SidebarProvider>
    // <AppSidebar />
    // <SidebarInset>
    <main className="bg-background relative flex min-h-svh flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl p-4"></div>
          <div className="bg-muted/50 aspect-video rounded-xl p-4"></div>
          <div className="bg-muted/50 aspect-video rounded-xl p-4"></div>
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
