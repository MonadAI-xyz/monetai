'use client';

import {ColumnDef} from '@tanstack/react-table';
import {format} from "date-fns"
import {DataTableColumnHeader} from '@/components/ui/data-table';
import {ITradingHistoryTable} from '@/types';


export const columns: ColumnDef<ITradingHistoryTable>[] = [

    {
        accessorKey: 'txDate',
        header: 'Tx. Date',
        cell: ({row}) => (
            <div className="capitalize">
                {row.getValue('txDate') ? format(row.getValue('txDate'), 'MMMM dd, yyyy') : '-'}
            </div>
        ),
    },
    {
        accessorKey: 'txDescription',
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Tx. Description"/>
        ),
    },
    {
        accessorKey: 'txHash',
        header: 'Tx. Hash',
        cell: ({row}) => (
            <div className="font-medium">{row.getValue('txHash')}</div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({row}) => (
            <div className="capitalize">
                {row.getValue('status') || '-'}
            </div>
        ),
    },
];
