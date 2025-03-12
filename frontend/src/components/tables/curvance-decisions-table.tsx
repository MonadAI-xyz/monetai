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

type CurvanceDecisionsTableProps = {
  id: string;
  action: string;
  marketAnalysis: string;
  riskAssessment: string;
  confidence: string;
};

export const columns: ColumnDef<CurvanceDecisionsTableProps>[] = [
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
    accessorKey: 'marketAnalysis',
    header: 'Market Analysis',
    cell: ({ row }) => row.getValue('marketAnalysis'),
  },
  {
    accessorKey: 'riskAssessment',
    header: 'Risk Assessment',
    cell: ({ row }) => row.getValue('riskAssessment'),
  },
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

export default function CurvanceDecisionsTable({ data }) {
  console.log('Curvance: ', data);
  return (
    <>
      <DataTable columns={columns} data={data} />
    </>
  );
}
