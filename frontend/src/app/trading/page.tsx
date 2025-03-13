import { Metadata } from "next";

import Header from "@/components/header";
import { DataTable, columns } from "@/components/ui/data-table";
import { transformTradingHistoryData } from "@/functions/transform-trading-history-data";
import { getTradingHistory } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Trading",
};

export default async function Page() {
  const response = await getTradingHistory();
  // console.log({ getTradingHistory: response });

  // Tranform the fetched data if sxists, otherwise fallback to static data
  const transformedData = response?.data?.count > 0
    ? transformTradingHistoryData(response?.data?.rows || [])
    : [];

  return (
    <main className="bg-background relative flex min-h-svh flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl p-4 md:min-h-min">
          <DataTable columns={columns} data={transformedData} title="MonetAI Tx. History" />
        </div>
      </div>
    </main>
  );
}
