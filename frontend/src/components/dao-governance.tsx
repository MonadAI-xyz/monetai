"use client";

import { useState } from 'react';
import { toast } from 'sonner';
// import { formatEther } from 'viem';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from '@/components/ui/progress';
import { Textarea } from "@/components/ui/textarea";

// Update MOCK_DATA in dao-governance.tsx
const MOCK_DATA = {
  votingDelay: 1, // 1 day
  votingPeriod: 7, // 7 days
  proposalThreshold: 500, // 500 tokens
  proposals: [
    {
      id: '1',
      title: 'Treasury Allocation Q2 2024',
      description: 'Proposal to allocate 1M tokens for Q2 2024 development',
      proposer: '0x1234...5678',
      status: 'Active',
      forVotes: 2500, // 2500 tokens
      againstVotes: 1500, // 1500 tokens
      abstainVotes: 500, // 500 tokens
      deadline: Date.now() + 86400000,
      executed: false,
      category: 'Treasury'
    },
    {
      id: '2',
      title: 'Reduce Proposal Threshold',
      description: 'Reduce proposal threshold from 500 tokens to 250 tokens',
      proposer: '0x8765...4321',
      status: 'Pending',
      forVotes: 1200, // 1200 tokens
      againstVotes: 800, // 800 tokens
      abstainVotes: 300, // 300 tokens
      deadline: Date.now() + 172800000, // 48 hours from now
      executed: false,
      category: 'Governance'
    },
    {
      id: '3',
      title: 'Protocol Upgrade v2.0',
      description: 'Implement new features and security improvements',
      proposer: '0x9876...0123',
      status: 'Executed',
      forVotes: 3500, // 3500 tokens
      againstVotes: 500, // 500 tokens
      abstainVotes: 200, // 200 tokens
      deadline: Date.now() - 86400000, // 24 hours ago
      executed: true,
      category: 'Development'
    }
  ]
};

type VoteType = 'For' | 'Against' | 'Abstain';

export default function DAOGovernance() {
  const { address } = useAccount();
  const [proposals, setProposals] = useState(MOCK_DATA.proposals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  // Use mock data instead of contract reads
  const votingDelay = MOCK_DATA.votingDelay;
  const votingPeriod = MOCK_DATA.votingPeriod;
  const proposalThreshold = MOCK_DATA.proposalThreshold;

  const handleCreateProposal = async () => {
    if (!description) {
      toast.error('Please enter a proposal description');
      return;
    }

    try {
      setIsSubmitting(true);

      // Mock proposal creation
      const newProposal = {
        id: (proposals.length + 1).toString(),
        title: description.split('\n')[0] || 'Untitled Proposal',
        description,
        proposer: address || '0x0',
        status: 'Pending',
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
        deadline: Date.now() + Number(votingDelay) * 1000,
        executed: false
      };

      setProposals([...proposals, newProposal]);
      toast.success('Proposal created successfully!');
      setIsModalOpen(false);
      setDescription('');
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = (proposalId: string, voteType: VoteType) => {
    setProposals(prevProposals =>
      prevProposals.map(proposal => {
        if (proposal.id === proposalId) {
          const voteAmount = 1; // 1 token
          return {
            ...proposal,
            forVotes: voteType === 'For' ? proposal.forVotes + voteAmount : proposal.forVotes,
            againstVotes: voteType === 'Against' ? proposal.againstVotes + voteAmount : proposal.againstVotes,
            abstainVotes: voteType === 'Abstain' ? proposal.abstainVotes + voteAmount : proposal.abstainVotes,
          };
        }
        return proposal;
      })
    );
    toast.success(`Voted ${voteType.toLowerCase()} on proposal ${proposalId}`);
  };

  const calculateProgress = (proposal: typeof MOCK_DATA.proposals[0]) => {
    const total = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
    return total === 0 ? 0 : Number((proposal.forVotes * 100) / total);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>DAO Governance</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Voting Delay</h4>
              <p className="text-2xl font-bold">
                {`${Number(votingDelay)} days`}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Voting Period</h4>
              <p className="text-2xl font-bold">
                {`${Number(votingPeriod)} days`}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Proposal Threshold</h4>
              <p className="text-2xl font-bold">
                {`${proposalThreshold} tokens`}
              </p>
            </div>

            <div className="pt-4">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={!address}>
                    Create Proposal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                    <DialogDescription>
                      Create a new governance proposal. You need {proposalThreshold} tokens to create a proposal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="description">Proposal Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter your proposal description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={isSubmitting}
                      onClick={handleCreateProposal}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Proposal'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Proposals</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{proposal.title}</h3>
                      <p className="text-sm text-muted-foreground">{proposal.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${proposal.status === 'Active' ? 'bg-green-100 text-green-800' :
                      proposal.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {proposal.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Progress className="h-2" value={calculateProgress(proposal)} />
                    <div className="flex justify-between text-sm">
                      <span>For: {proposal.forVotes} tokens</span>
                      <span>Against: {proposal.againstVotes} tokens</span>
                      <span>Abstain: {proposal.abstainVotes} tokens</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      disabled={!address}
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 'For')}
                    >
                      Vote For
                    </Button>
                    <Button
                      disabled={!address}
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 'Against')}
                    >
                      Vote Against
                    </Button>
                    <Button
                      disabled={!address}
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 'Abstain')}
                    >
                      Abstain
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
