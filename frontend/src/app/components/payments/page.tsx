import { Payment, columns } from './columns';
import { DataTable } from './data-table';

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

export default async function PaymentsDemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
