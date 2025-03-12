"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEther } from "ethers";

const MOCK_STATS = {
  totalVotes: 10500, // 10,500 tokens total votes
  totalProposals: 15,
  activeProposals: 2,
  participationRate: 72.5,
  recentVotes: [
    { date: '2024-03-10', votes: 2500 }, // 2500 tokens
    { date: '2024-03-09', votes: 2300 }, // 2300 tokens
    { date: '2024-03-08', votes: 1950 }, // 1950 tokens
  ],
  topVoters: [
    { address: '0x1234...5678', votes: 4500 }, // 4500 tokens
    { address: '0x8765...4321', votes: 3800 }, // 3800 tokens
    { address: '0x9876...0123', votes: 3200 }, // 3200 tokens
  ]
};

export default function DAOVotingStats() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Voting Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Total Votes Cast</h4>
              <p className="text-2xl font-bold">{MOCK_STATS.totalVotes.toLocaleString()} tokens</p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Participation Rate</h4>
              <div className="space-y-2">
                <Progress value={MOCK_STATS.participationRate} className="h-2" />
                <p className="text-sm text-muted-foreground">{MOCK_STATS.participationRate}% of token holders</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Proposal Statistics</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{MOCK_STATS.totalProposals}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold">{MOCK_STATS.activeProposals}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Top Voters</h4>
              <div className="space-y-2 mt-2">
                {MOCK_STATS.topVoters.map((voter, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{voter.address}</span>
                    <span className="text-sm font-medium">{voter.votes.toLocaleString()} tokens</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 