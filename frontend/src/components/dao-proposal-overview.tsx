"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePublicClient } from 'wagmi';
import { decodeEventLog } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { Loader } from "@/components/ui/loader";

// Constants
const DEPLOY_BLOCK = BigInt("7583062");
const END_BLOCK = BigInt("7583273");

type ProposalSummary = {
  id: bigint;
  description: string;
  status: string;
  startBlock: number;
  endBlock: number;
};

export default function DAOProposalOverview() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const CHUNK_SIZE = BigInt(100);
        const events = [];
        
        for (let fromBlock = DEPLOY_BLOCK; fromBlock <= END_BLOCK; fromBlock += CHUNK_SIZE) {
          const toBlock = fromBlock + CHUNK_SIZE > END_BLOCK ? END_BLOCK : fromBlock + CHUNK_SIZE;
          
          try {
            const chunkEvents = await publicClient.getLogs({
              address: CONTRACTS.GOVERNOR.address as `0x${string}`,
              event: {
                type: 'event',
                name: 'ProposalCreated',
                inputs: [
                  { type: 'uint256', name: 'proposalId', indexed: false },
                  { type: 'address', name: 'proposer', indexed: true },
                  { type: 'address[]', name: 'targets', indexed: false },
                  { type: 'uint256[]', name: 'values', indexed: false },
                  { type: 'string[]', name: 'signatures', indexed: false },
                  { type: 'bytes[]', name: 'calldatas', indexed: false },
                  { type: 'uint256', name: 'startBlock', indexed: false },
                  { type: 'uint256', name: 'endBlock', indexed: false },
                  { type: 'string', name: 'description', indexed: false }
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
            const decodedData = decodeEventLog({
              abi: CONTRACTS.GOVERNOR.abi,
              data: event.data,
              topics: [event.topics[0]],
              strict: false
            }) as any;

            const {
              proposalId,
              description,
              voteStart,
              voteEnd
            } = decodedData.args as any;

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
        <Loader />
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
              <div key={proposal.id.toString()} className="flex items-center justify-between p-4 border rounded-lg">
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