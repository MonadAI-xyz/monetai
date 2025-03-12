'use client';


import { CheckedState } from '@radix-ui/react-checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DataTable,
  // DataTableColumnHeader
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { replaceMultipleWords } from '@/functions';
// import { Input } from '@/components/ui/input';

type DecisionsTradingTable = {
  id: string;
  pair: string;
  action: string;
  pairSelection: string;
  riskAssessment: string;
  marketCondition: string;
  technicalAnalysis: string;
  modelAgreement: string;
  confidence: string;
};

export const columns: ColumnDef<DecisionsTradingTable>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          ((table.getIsSomePageRowsSelected() &&
            'indeterminate') as CheckedState)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'pair',
    header: 'Pair',
    cell: ({ row }) => row.getValue('pair') || '-',
  },
  // {
  //   accessorKey: 'action',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Action" />
  //   ),
  // },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => row.getValue('action'),
  },
  {
    accessorKey: 'pairSelection',
    header: 'Pair Selection',
    cell: ({ row }) => row.getValue('pairSelection'),
  },
  {
    accessorKey: 'riskAssessment',
    header: 'Risk Assessment',
    cell: ({ row }) => row.getValue('riskAssessment'),
  },
  // {
  //   accessorKey: 'marketCondition',
  //   header: 'Market Condition',
  //   cell: ({ row }) => (
  //     <div className="font-medium">{row.getValue('marketCondition')}</div>
  //   ),
  // },
  {
    accessorKey: 'technicalAnalysis',
    header: 'Technical Analysis',
    cell: ({ row }) => replaceMultipleWords(
      row.getValue('technicalAnalysis'),
      { "gpt": "", "DeepSeek": "" }
    ),
  },
  // {
  //   accessorKey: 'modelAgreement',
  //   header: 'Model Agreement',
  //   cell: ({ row }) => (
  //     <div className="font-medium">{row.getValue('modelAgreement')}</div>
  //   ),
  // },
  {
    accessorKey: 'confidence',
    header: 'Confidence',
    cell: ({ row }) => row.getValue('confidence'),
  },
  {
    id: 'actions',
    // header: 'Action',
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function TradingDecisionsTable({ data }) {
  console.log('Trading: ', data);
  return (
    <>
      <DataTable columns={columns} data={data} />
    </>
  );
}
