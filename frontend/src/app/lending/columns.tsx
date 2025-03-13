'use client';

import {ColumnDef} from '@tanstack/react-table';
import {format} from "date-fns"
import {MoreHorizontal} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {DataTableColumnHeader} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LendingHistoryTableProps = {
  id: string;
  txDate: string;
  txDescription: string;
  txHash: string;
};


export const columns: ColumnDef<LendingHistoryTableProps>[] = [
  {
    accessorKey: 'txDate',
    header: 'Tx. Date',
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue('txDate') ? format(row.getValue('txDate'), 'MMMM dd, yyyy') : '-'}
      </div>
    ),
  },
  {
    accessorKey: 'txDescription',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tx. Description" />
    ),
  },
  {
    accessorKey: 'txHash',
    header: 'Tx. Hash',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('txHash')}</div>
    ),
  },
  {
    id: 'actions',
    header: 'Action',
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
