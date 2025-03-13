"use client";

import {useEffect, useState} from 'react';
import {decodeEventLog} from 'viem';
import {usePublicClient} from 'wagmi';

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Loader} from "@/components/ui/loader";
import {CONTRACTS} from '@/config/contracts';

// Constants
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0");
let END_BLOCK: bigint | undefined = process.env.NEXT_PUBLIC_END_BLOCK
    ? BigInt(process.env.NEXT_PUBLIC_END_BLOCK)
    : undefined;

type ProposalSummary = {
    id: bigint;
    description: string;
    status: string;
    startBlock: number;
    endBlock: number;
};

interface ProposalCreatedLog {
    args: {
        proposalId: bigint;
        description: string;
        voteStart: number;
        voteEnd: number;
    };
    data: `0x${string}`;
    topics: [`0x${string}`];
}

export default function DAOProposalOverview() {
    const [proposals, setProposals] = useState<ProposalSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const publicClient = usePublicClient();

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                // If END_BLOCK isn't defined, fetch current block number
                if (!END_BLOCK) {
                    const currentBlock = await publicClient.getBlockNumber();
                    END_BLOCK = currentBlock;
                    console.log(`Using current block as END_BLOCK: ${END_BLOCK}`);
                }

                const CHUNK_SIZE = BigInt(100);
                const events: ProposalCreatedLog[] = [];

                for (let fromBlock = DEPLOY_BLOCK; fromBlock <= END_BLOCK; fromBlock += CHUNK_SIZE) {
                    const toBlock = fromBlock + CHUNK_SIZE > END_BLOCK ? END_BLOCK : fromBlock + CHUNK_SIZE;

                    try {
                        const chunkEvents: any[] = await publicClient.getLogs({
                            address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                            event: {
                                type: 'event',
                                name: 'ProposalCreated',
                                inputs: [
                                    {type: 'uint256', name: 'proposalId', indexed: false},
                                    {type: 'address', name: 'proposer', indexed: true},
                                    {type: 'address[]', name: 'targets', indexed: false},
                                    {type: 'uint256[]', name: 'values', indexed: false},
                                    {type: 'string[]', name: 'signatures', indexed: false},
                                    {type: 'bytes[]', name: 'calldatas', indexed: false},
                                    {type: 'uint256', name: 'startBlock', indexed: false},
                                    {type: 'uint256', name: 'endBlock', indexed: false},
                                    {type: 'string', name: 'description', indexed: false}
                                ]
                            },
                            fromBlock,
                            toBlock
                        }) as any;

                        events.push(...chunkEvents);
                    } catch (error) {
                        console.log(`Error fetching chunk ${fromBlock}-${toBlock}:`, error);
                    }
                }

                const proposalPromises = events.map(async (event) => {
                    try {

                        // @ts-expect-error - Temporary fix
                        const decodedData = decodeEventLog({
                            abi: CONTRACTS.GOVERNOR.abi,
                            data: event.data,
                            topics: [event.topics[0]],
                            strict: false
                        }) as ProposalCreatedLog;

                        const {
                            proposalId,
                            description,
                            voteStart,
                            voteEnd
                        } = decodedData.args;

                        const state = await publicClient.readContract({
                            address: CONTRACTS.GOVERNOR.address as `0x${string}`,
                            abi: CONTRACTS.GOVERNOR.abi,
                            functionName: 'state',
                            args: [proposalId],
                        });

                        return {
                            id: proposalId,
                            description,
                            status: getProposalState(Number(state)),
                            startBlock: Number(voteStart),
                            endBlock: Number(voteEnd),
                        };
                    } catch (error) {
                        console.log(`Error processing proposal:`, error);
                        return null;
                    }
                });

                const fetchedProposals = await Promise.all(proposalPromises);
                const validProposals = fetchedProposals.filter((p): p is ProposalSummary => p !== null);
                setProposals(validProposals);
            } catch (error) {
                console.log('Error fetching proposals:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposals();
    }, [publicClient]);

    const getProposalState = (state: number) => {
        const states = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
        return states[state] || 'Unknown';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader/>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Proposals</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {proposals.length === 0 ? (
                        <p className="text-center text-muted-foreground">No proposals found</p>
                    ) : (
                        proposals.map((proposal) => (
                            <div key={proposal.id.toString()}
                                 className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <p className="font-medium">
                                        #{proposal.id.toString().slice(0, 4)}...{proposal.id.toString().slice(-4)}
                                    </p>
                                    <p className="text-sm text-muted-foreground font-semibold">
                                        {proposal.description}
                                    </p>
                                </div>
                                <Badge variant={
                                    proposal.status === 'Active' ? 'default' :
                                        proposal.status === 'Succeeded' ? 'secondary' :
                                            proposal.status === 'Defeated' ? 'destructive' :
                                                'secondary'
                                }>
                                    {proposal.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}