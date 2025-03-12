// import { Metadata } from 'next';

import ERC20BalancePieChart from '@/components/charts/erc20-token-balance-chart';
import OHLCPriceMetricsChart from '@/components/charts/ohlc-price-metrics-chart';
import Header from '@/components/header';
import DecisionsHistoryTable from '@/components/tables/decisions-history-table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { parseTradingData } from '@/functions';
import { transformTradingHistoryData } from '@/functions/transform-trading-history-data';
import { getDecisions, getTradingHistory } from '@/lib/actions';

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

  // Get decisions history
  const decisions = await getDecisions();
  const { tradingDecisions, curvanceDecisions } = parseTradingData(decisions.data.rows);
  // console.log("Trading Decisions:", tradingDecisions);
  // console.log("Curvance Decisions:", curvanceDecisions);

  return (
    <main className="bg-background relative flex min-h-svh flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-6">Portfolio Overview</h3>
            {/* <PortfolioOverview /> */}
            <ERC20BalancePieChart />
          </div>
          {/* <div className="bg-muted/50 rounded-xl p-4">
            <DAOGovernance />
          </div> */}
          <div className="bg-muted/50 rounded-xl p-4 md:col-span-2">
            <OHLCPriceMetricsChart />
          </div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl p-4 md:min-h-min">
          <h2 className="font-semibold tracking-tight text-xl mb-4">Decisions History</h2>
          {/* <DataTable columns={columns} data={transformedData} /> */}
          <Tabs defaultValue="trading">
            <TabsList>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="yieldFarming">Yield Farming</TabsTrigger>
            </TabsList>
            <TabsContent value="trading">
              <DecisionsHistoryTable data={tradingDecisions} />
            </TabsContent>
            <TabsContent value="yieldFarming">Change your password here.</TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
