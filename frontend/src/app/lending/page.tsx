import { Metadata } from "next";

import { columns } from "./columns";
import { lendingHistoryData } from "./data";

import Header from "@/components/header";
import { DataTable } from "@/components/ui/data-table";


export const metadata: Metadata = {
  title: "Lending",
};

export default async function Page() {
  return (
    <main className="bg-background relative flex min-h-svh flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl p-4 md:min-h-min">
          <DataTable columns={columns} data={lendingHistoryData} title="Lending History" />
        </div>
      </div>
    </main>
  );
}
