"use client";

import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { usePublicClient } from 'wagmi';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Progress } from "@/components/ui/progress";
import { CONTRACTS } from '@/config/contracts';

// Update the constants
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0");
let END_BLOCK: bigint | undefined = process.env.NEXT_PUBLIC_END_BLOCK 
  ? BigInt(process.env.NEXT_PUBLIC_END_BLOCK) 
  : undefined;

type ProposalVotes = {
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
};

interface ProposalCreatedLog {
  args: {
    proposalId: bigint;
    proposer: `0x${string}`;
    targets: `0x${string}`[];
    values: bigint[];
    signatures: string[];
    calldatas: `0x${string}`[];
    startBlock: bigint;
    endBlock: bigint;
    description: string;
  };
  data: `0x${string}`;
  topics: [`0x${string}`];
}

export default function DAOVotingStats() {
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [forPercentage, setForPercentage] = useState<number>(0);
  const [againstPercentage, setAgainstPercentage] = useState<number>(0);
  const [abstainPercentage, setAbstainPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchVotingStats = async () => {
      try {
        setIsLoading(true);
        
        // If END_BLOCK isn't defined, fetch current block number
        if (!END_BLOCK) {
          const currentBlock = await publicClient.getBlockNumber();
          END_BLOCK = currentBlock;
          console.log(`Using current block as END_BLOCK: ${END_BLOCK}`);
        }
        
        const CHUNK_SIZE = BigInt(90);
        const events = [];
        
        for (let fromBlock = DEPLOY_BLOCK; fromBlock <= END_BLOCK;) {
          let toBlock = fromBlock + CHUNK_SIZE > END_BLOCK ? END_BLOCK : fromBlock + CHUNK_SIZE - BigInt(1);
          
          try {
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const chunkEvents :any[]= await publicClient.getLogs({
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
            fromBlock = toBlock + BigInt(1); // Move to next chunk
            
          } catch (error: any) {
            if (error?.message?.includes('eth_getLogs is limited')) {
              // If we hit the limit, reduce chunk size and retry
              const newChunkSize = BigInt(Number(toBlock - fromBlock) / 2); // Convert to number for division
              toBlock = fromBlock + newChunkSize;
              console.log(`Reducing chunk size, retrying with range ${fromBlock} to ${toBlock}`);
              continue; // Retry with smaller chunk
            } else {
              console.log(`Error fetching chunk ${fromBlock}-${toBlock}:`, error);
              fromBlock = toBlock + BigInt(1); // Skip problematic chunk
            }
          }
        }

        // Fetch votes for each proposal
        const votesPromises = events.map((event: ProposalCreatedLog) => 
          publicClient.readContract({
            address: CONTRACTS.GOVERNOR.address as `0x${string}`,
            abi: CONTRACTS.GOVERNOR.abi,
            functionName: 'proposalVotes',
            args: [BigInt(event.args?.proposalId || 0)],
          })
        );

        const allVotes = await Promise.all(votesPromises);

        // Calculate totals
        let totalFor = BigInt(0);
        let totalAgainst = BigInt(0);
        let totalAbstain = BigInt(0);

        allVotes.forEach((votes: ProposalVotes) => {
          // Convert each value to BigInt explicitly
          totalFor += BigInt(votes.forVotes.toString());
          totalAgainst += BigInt(votes.againstVotes.toString());
          totalAbstain += BigInt(votes.abstainVotes.toString());
        });

        // Convert to numbers for display
        const totalBigInt = totalFor + totalAgainst + totalAbstain;
        const total = Number(formatEther(totalBigInt));
        
        setTotalVotes(total);
        setForPercentage(total > 0 ? (Number(formatEther(totalFor)) / total) * 100 : 0);
        setAgainstPercentage(total > 0 ? (Number(formatEther(totalAgainst)) / total) * 100 : 0);
        setAbstainPercentage(total > 0 ? (Number(formatEther(totalAbstain)) / total) * 100 : 0);

      } catch (error) {
        console.log('Error fetching voting stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotingStats();
  }, [publicClient]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voting Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Loader />
            <p className="text-muted-foreground mt-2">Loading voting stats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Total Votes Cast</span>
            <span className="text-sm font-medium">{totalVotes.toFixed(2)}</span>
          </div>
          <Progress className="h-2" value={100}/>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">For</span>
            <span className="text-sm font-medium">{forPercentage.toFixed(1)}%</span>
          </div>
          <Progress className="h-2 bg-green-100" value={forPercentage} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Against</span>
            <span className="text-sm font-medium">{againstPercentage.toFixed(1)}%</span>
          </div>
          <Progress className="h-2 bg-red-100" value={againstPercentage} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Abstain</span>
            <span className="text-sm font-medium">{abstainPercentage.toFixed(1)}%</span>
          </div>
          <Progress className="h-2 bg-gray-100" value={abstainPercentage} />
        </div>
      </CardContent>
    </Card>
  );
} 