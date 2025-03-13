'use client';


import {ColumnDef} from '@tanstack/react-table';
import {DataTable,} from '@/components/ui/data-table';
import {format} from "date-fns";

type CurvanceDecisionsTableProps = {
    id: string;
    action: string;
    marketAnalysis: string;
    riskAssessment: string;
    confidence: string;
};

export const columns: ColumnDef<CurvanceDecisionsTableProps>[] = [
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
        accessorKey: 'action',
        header: 'Action',
        cell: ({row}) => row.getValue('action'),
    },
    {
        accessorKey: 'marketAnalysis',
        header: 'Market Analysis',
        cell: ({row}) => row.getValue('marketAnalysis'),
    },
    {
        accessorKey: 'riskAssessment',
        header: 'Risk Assessment',
        cell: ({row}) => row.getValue('riskAssessment'),
    },
    {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({row}) => row.getValue('confidence'),
    },
];

export default function CurvanceDecisionsTable({data}) {
    console.log('Curvance: ', data);
    return (
        <>
            <DataTable columns={columns} data={data}/>
        </>
    );
}
