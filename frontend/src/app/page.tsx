// import { Metadata } from 'next';

// import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import { columns, DataTable, Payment } from '@/components/ui/data-table';
// import {
//   SidebarInset,
//   SidebarProvider,
// } from '@/components/ui/sidebar';

// export const metadata: Metadata = {
//   title: "Home",
// };

async function getData(): Promise<Payment[]> {
  // Generate 20 dummy Payment objects
  return Array.from({ length: 20 }, (_, i) => {
    const statuses = ['pending', 'success', 'processing', 'failed'];
    return {
      id: `dummy-id-${i}`,
      amount: Math.floor(Math.random() * 1000),
      status: statuses[i % statuses.length] as Payment['status'],
      email: `dummy${i}@example.com`,
    };
  });
}

export default async function Page() {
  const data = await getData();

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
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </main>
    // </SidebarInset>
    // </SidebarProvider>
  );
}
