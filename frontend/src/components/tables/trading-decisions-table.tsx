'use client';


import {ColumnDef} from '@tanstack/react-table';
import {DataTable,} from '@/components/ui/data-table';
import {replaceMultipleWords} from '@/functions';
import {format} from "date-fns"

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
        accessorKey: 'createdAt',
        header: 'Tx. Date',
        cell: ({row}) => (
            <div className="capitalize">
                {row.getValue('createdAt') ? format(row.getValue('createdAt'), 'MMMM dd, yyyy') : '-'}
            </div>
        ),
    },
    {
        accessorKey: 'pair',
        header: 'Pair',
        cell: ({row}) => row.getValue('pair') || '-',
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
        cell: ({row}) => row.getValue('action'),
    },
    {
        accessorKey: 'pairSelection',
        header: 'Pair Selection',
        cell: ({row}) => row.getValue('pairSelection'),
    },
    {
        accessorKey: 'riskAssessment',
        header: 'Risk Assessment',
        cell: ({row}) => row.getValue('riskAssessment'),
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
        cell: ({row}) => replaceMultipleWords(
            row.getValue('technicalAnalysis'),
            {"gpt": "", "DeepSeek": ""}
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
        cell: ({row}) => row.getValue('confidence'),
    },
];

export default function TradingDecisionsTable({data}) {
    console.log('Trading: ', data);
    return (
        <>
            <DataTable columns={columns} data={data}/>
        </>
    );
}
