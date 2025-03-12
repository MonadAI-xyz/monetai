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
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue('pair') || '-'}
      </div>
    ),
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
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('action')}</div>
    ),
  },
  {
    accessorKey: 'pairSelection',
    header: 'Pair Selection',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('pairSelection')}</div>
    ),
  },
  {
    accessorKey: 'riskAssessment',
    header: 'Risk Assessment',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('riskAssessment')}</div>
    ),
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
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('technicalAnalysis')}</div>
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
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('confidence')}</div>
    ),
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

export default function DecisionsHistoryTable({ data }) {
  console.log('Trading: ', data);
  return (
    <>
      <DataTable columns={columns} data={data} />
    </>
  );
}
